// Ayudas de prueba: una interfaz de programación simulada, por método y ruta.
// Ninguna prueba hace una llamada real (Tabla 23 · Jest y React Testing Library).
export function respuesta(estado, cuerpo) {
  return {
    ok: estado >= 200 && estado < 300,
    status: estado,
    json: async () => {
      if (cuerpo === undefined) throw new Error("sin cuerpo");
      return cuerpo;
    },
  };
}

export function simularApi(rutas) {
  const llamadas = [];
  global.fetch = jest.fn(async (url, opciones) => {
    const clave = `${opciones.method} ${url.replace("/api/v1", "")}`;
    llamadas.push({
      clave,
      cuerpo: opciones.body && JSON.parse(opciones.body),
      cabeceras: opciones.headers,
    });
    const manejador = rutas[clave];
    if (!manejador)
      return respuesta(404, { status: 404, detail: `sin simular: ${clave}` });
    const [estado, cuerpo] =
      typeof manejador === "function" ? manejador(opciones) : manejador;
    return respuesta(estado, cuerpo);
  });
  return llamadas;
}

export function sesionGuardada(datos = {}) {
  sessionStorage.setItem(
    "sesion",
    JSON.stringify({
      token: "tok",
      vence_en: new Date(Date.now() + 3_600_000).toISOString(),
      credencial_provisional: false,
      ...datos,
    }),
  );
}

export const usuarioDe = (rol, extra = {}) => ({
  id: "u1",
  nombre: "Ana",
  apellido: "Gómez",
  rol,
  credencial_provisional: false,
  ...extra,
});

export const sesionDe = (rol, extra = {}) => ({
  token: "tok",
  vence_en: new Date(Date.now() + 3_600_000).toISOString(),
  usuario: usuarioDe(rol, extra),
});

export const panelDe = (rol, extra = {}) => ({
  rol,
  nombre: "Ana",
  opciones_habilitadas: ["anuncios", "preferencias"],
  anuncios_sin_leer: 3,
  cursos: [],
  ...extra,
});

export const persona = (id, nombre, apellido, extra = {}) => ({
  id,
  nombre,
  apellido,
  correo: `${nombre.toLowerCase()}@ejemplo.test`,
  estado: "activo",
  ...extra,
});

export const cursoConNomina = (extra = {}) => ({
  id: "c1",
  anio_lectivo_id: "an1",
  nombre: "Primero A",
  turno: "mañana",
  estado: "vigente",
  alumnos_vinculados: 1,
  docentes: [
    persona("d1", "Ana", "Zárate", { es_titular: true }),
    persona("d2", "Luis", "Acosta", { es_titular: false }),
  ],
  alumnos: [
    {
      ...persona("al1", "Beto", "Ramos"),
      tutores: [persona("t1", "Marta", "Ramos")],
    },
  ],
  ...extra,
});
