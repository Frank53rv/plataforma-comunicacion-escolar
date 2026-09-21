// RNF-08 Latencia de entrega de mensajes · CU-12
// Prueba: CP-RNF-08
//
// RNF-08 (Tabla 11) · «La entrega de un mensaje al destinatario conectado se produce en
// menos de dos segundos en condiciones de prueba controladas.» Tabla 37 · instrumento:
// «registro de marcas de tiempo del cliente y del servidor»; escenario: «conversación sobre
// el entorno de demostración bajo carga nominal».
//
// Un emisor envía mensajes por HTTP al canal grupal; N receptores conectados por WSS a la
// misma conversación anotan cuándo llega cada uno. Para cada llegada se registran dos
// intervalos: desde que el emisor pidió el envío (marca del cliente) y desde que el servidor
// persistió el mensaje, `enviado_en` (marca del servidor). El emisor y los receptores
// corren en el mismo equipo, de modo que comparten reloj.
//
// Uso:  node scripts/medir-latencia.js --emisor correo --receptores correo1,correo2,…
//         [--base http://localhost:8080] [--mensajes 50] [--contrasena …]
const argumentos = Object.fromEntries(
  process.argv
    .slice(2)
    .join(" ")
    .split("--")
    .filter(Boolean)
    .map((par) => {
      const [clave, ...valor] = par.trim().split(" ");
      return [clave, valor.join(" ")];
    }),
);

const BASE = argumentos.base || "http://localhost:8080";
const MENSAJES = Number(argumentos.mensajes || 50);
const CONTRASENA = argumentos.contrasena || "prueba-2026";
const UMBRAL_MS = 2000;
const emisor = argumentos.emisor;
const receptores = (argumentos.receptores || "").split(",").filter(Boolean);

if (!emisor || receptores.length === 0) {
  console.error("Faltan --emisor y --receptores.");
  process.exit(2);
}

async function pedir(metodo, ruta, cuerpo, token) {
  const respuesta = await fetch(`${BASE}/api/v1${ruta}`, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new Error(`${metodo} ${ruta} → ${respuesta.status}`);
  return datos;
}

const ingresar = async (correo) =>
  (await pedir("POST", "/sesiones", { correo, contrasena: CONTRASENA })).token;

// Una conexión de tiempo real que anota la hora de llegada de cada mensaje por su id.
function conectar(token, conversacionId) {
  return new Promise((resolver, rechazar) => {
    const llegadas = new Map();
    const identificador = JSON.stringify({
      channel: "ConversacionChannel",
      conversacion_id: conversacionId,
    });
    const url = `${BASE.replace(/^http/, "ws")}/cable?token=${encodeURIComponent(token)}`;
    // Como un navegador: el subprotocolo de ActionCable y el origen que la interfaz de
    // programación tiene permitido (CORS_ORIGENES). Node no envía el segundo por sí solo.
    const socket = new WebSocket(url, {
      protocols: ["actioncable-v1-json"],
      headers: { Origin: BASE },
    });
    const plazo = setTimeout(
      () => rechazar(new Error("sin confirmación de la suscripción")),
      10_000,
    );

    socket.onmessage = (evento) => {
      const trama = JSON.parse(evento.data);
      if (trama.type === "welcome")
        socket.send(
          JSON.stringify({ command: "subscribe", identifier: identificador }),
        );
      else if (trama.type === "confirm_subscription") {
        clearTimeout(plazo);
        resolver({ llegadas, cerrar: () => socket.close() });
      } else if (trama.type === "reject_subscription")
        rechazar(new Error("suscripción rechazada"));
      else if (trama.message?.id) llegadas.set(trama.message.id, Date.now());
    };
    socket.onerror = () => rechazar(new Error("no se pudo conectar"));
  });
}

const percentil = (ordenados, p) =>
  ordenados[
    Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1)
  ];
const resumen = (valores) => {
  const o = [...valores].sort((a, b) => a - b);
  return {
    minimo: o[0],
    p50: percentil(o, 50),
    p95: percentil(o, 95),
    maximo: o[o.length - 1],
  };
};

const tokenEmisor = await ingresar(emisor);
const canales = await pedir(
  "GET",
  "/conversaciones?pagina=1&por_pagina=25",
  null,
  tokenEmisor,
);
const conversacionId = canales.datos[0].id;

const tokens = await Promise.all([emisor, ...receptores].map(ingresar));
const conexiones = await Promise.all(
  tokens.map((token) => conectar(token, conversacionId)),
);

const envios = [];
for (let n = 1; n <= MENSAJES; n += 1) {
  const pedido = Date.now();
  const mensaje = await pedir(
    "POST",
    `/conversaciones/${conversacionId}/mensajes`,
    { cuerpo: `Medición ${n}` },
    tokenEmisor,
  );
  envios.push({
    id: mensaje.id,
    pedido,
    persistido: Date.parse(mensaje.enviado_en),
  });
  await new Promise((seguir) => setTimeout(seguir, 100));
}
await new Promise((seguir) => setTimeout(seguir, 1500));

const desdeElPedido = [];
const desdeElServidor = [];
let perdidos = 0;
for (const envio of envios) {
  for (const conexion of conexiones) {
    const llegada = conexion.llegadas.get(envio.id);
    if (llegada === undefined) perdidos += 1;
    else {
      desdeElPedido.push(llegada - envio.pedido);
      desdeElServidor.push(llegada - envio.persistido);
    }
  }
}
conexiones.forEach((conexion) => conexion.cerrar());

const cumple = perdidos === 0 && Math.max(...desdeElPedido) < UMBRAL_MS;
console.log(
  JSON.stringify(
    {
      conversacion: conversacionId,
      conectados: conexiones.length,
      mensajes: envios.length,
      entregas_esperadas: envios.length * conexiones.length,
      entregas_perdidas: perdidos,
      desde_el_pedido_ms: resumen(desdeElPedido),
      desde_el_servidor_ms: resumen(desdeElServidor),
      umbral_ms: UMBRAL_MS,
      cumple_rnf_08: cumple,
    },
    null,
    2,
  ),
);
process.exit(cumple ? 0 : 1);
