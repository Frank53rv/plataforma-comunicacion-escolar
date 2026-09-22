// RNF-09 Tiempo de respuesta de consultas · CU-09, CU-12
// Prueba: CP-RNF-09
//
// RNF-09 (Tabla 11) · «Los endpoints de consulta de anuncios e historial responden en menos de
// 1,5 segundos en el percentil 95 de 100 peticiones consecutivas, sobre un conjunto de prueba
// equivalente a dos años lectivos del curso piloto.» Tabla 37 · instrumento: «medición sobre
// peticiones repetidas con la paginación por omisión de la Tabla 28».
//
// Pide cada consulta 100 veces seguidas, con la cuenta de un rol que la tiene autorizada, y
// informa el mínimo, la mediana, el percentil 95 y el máximo en milisegundos. Sobre el conjunto
// de datos_de_prueba:cargar.
//
// Uso:  node scripts/medir-consultas.js --docente correo --tutor correo --directivo correo
//         [--base http://localhost:8080] [--repeticiones 100] [--contrasena …]
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
const REPETICIONES = Number(argumentos.repeticiones || 100);
const CONTRASENA = argumentos.contrasena || "prueba-2026";
const UMBRAL_MS = 1500;

async function pedir(ruta, token, metodo = "GET", cuerpo) {
  const inicio = performance.now();
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
  return { datos, ms: performance.now() - inicio };
}

const ingresar = async (correo) =>
  (await pedir("/sesiones", null, "POST", { correo, contrasena: CONTRASENA }))
    .datos;
const percentil = (ordenados, p) =>
  ordenados[
    Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1)
  ];

async function medir(nombre, ruta, token) {
  await pedir(ruta, token); // calentamiento, no cuenta
  const tiempos = [];
  for (let i = 0; i < REPETICIONES; i += 1)
    tiempos.push((await pedir(ruta, token)).ms);
  const o = tiempos.sort((a, b) => a - b);
  const p95 = percentil(o, 95);
  return {
    consulta: nombre,
    ruta,
    minimo: Math.round(o[0]),
    p50: Math.round(percentil(o, 50)),
    p95: Math.round(p95),
    maximo: Math.round(o[o.length - 1]),
    cumple: p95 < UMBRAL_MS,
  };
}

const docente = await ingresar(argumentos.docente);
const tutor = await ingresar(argumentos.tutor);
const directivo = await ingresar(argumentos.directivo);
const propios = (
  await pedir(
    `/anuncios?remitente_id=${docente.usuario.id}&pagina=1&por_pagina=1`,
    docente.token,
  )
).datos.datos[0];
const canal = (
  await pedir("/conversaciones?pagina=1&por_pagina=25", docente.token)
).datos.datos[0];

const resultados = [
  await medir(
    "Historial de anuncios · tutor",
    "/anuncios?pagina=1&por_pagina=25",
    tutor.token,
  ),
  await medir(
    "Historial de anuncios · docente",
    "/anuncios?pagina=1&por_pagina=25",
    docente.token,
  ),
  await medir(
    "Historial de anuncios · directivo",
    "/anuncios?pagina=1&por_pagina=25",
    directivo.token,
  ),
  await medir(
    "Historial filtrado por fecha · tutor",
    "/anuncios?desde=2026-04-01T00:00:00Z&hasta=2026-06-30T23:59:59Z&pagina=1&por_pagina=25",
    tutor.token,
  ),
  await medir(
    "Detalle de un anuncio · tutor",
    `/anuncios/${propios.id}`,
    tutor.token,
  ),
  await medir(
    "Constancias de un anuncio · docente",
    `/anuncios/${propios.id}/constancias?pagina=1&por_pagina=25`,
    docente.token,
  ),
  await medir(
    "Conversaciones del usuario · docente",
    "/conversaciones?pagina=1&por_pagina=25",
    docente.token,
  ),
  await medir(
    "Historial de mensajes · docente",
    `/conversaciones/${canal.id}/mensajes?pagina=1&por_pagina=25`,
    docente.token,
  ),
];
console.log(
  JSON.stringify(
    {
      repeticiones: REPETICIONES,
      umbral_p95_ms: UMBRAL_MS,
      resultados,
      cumple_rnf_09: resultados.every((r) => r.cumple),
    },
    null,
    2,
  ),
);
process.exit(resultados.every((r) => r.cumple) ? 0 : 1);
