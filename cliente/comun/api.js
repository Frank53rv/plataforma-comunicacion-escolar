// RF-40 Paneles diferenciados por rol · RF-01 Autenticación · CU-01, CU-09 · RN-15
// Prueba: CP-RF-40 · CP-RF-01
//
// Fig. 13 · el cliente consume REST + JWT y «no implementa reglas de negocio ni decisiones
// de autorización: las solicita y presenta su resultado (RNF-21)». Este es el único punto de
// acceso a la interfaz de programación. Tabla 24 · presenta los nueve estados del catálogo
// sin revelar detalle interno.
const BASE = "/api/v1";

export class ErrorDeApi extends Error {
  constructor({ estado, codigo, detalle, regla }) {
    super(detalle || `Error ${estado}`);
    this.estado = estado;
    this.codigo = codigo;
    this.detalle = detalle;
    this.regla = regla;
  }
}

async function leerCuerpo(respuesta) {
  if (respuesta.status === 204) return null;
  try {
    return await respuesta.json();
  } catch {
    return null;
  }
}

// `obtenerToken` y `alNoAutenticado` los provee la sesión: el cliente HTTP no la conoce.
export function crearApi({
  obtenerToken = () => null,
  alNoAutenticado = () => {},
} = {}) {
  async function solicitar(
    metodo,
    ruta,
    cuerpo,
    { conservarSesion = false } = {},
  ) {
    const cabeceras = { Accept: "application/json" };
    const token = obtenerToken();
    if (token) cabeceras.Authorization = `Bearer ${token}`;
    if (cuerpo !== undefined) cabeceras["Content-Type"] = "application/json";

    let respuesta;
    try {
      respuesta = await globalThis.fetch(`${BASE}${ruta}`, {
        method: metodo,
        headers: cabeceras,
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      });
    } catch {
      throw new ErrorDeApi({
        estado: 0,
        detalle: "No fue posible comunicarse con el servidor.",
      });
    }

    const datos = await leerCuerpo(respuesta);
    if (respuesta.ok) return datos;

    // Un 401 es sesión vencida, salvo donde la interfaz lo usa para otra cosa: la contraseña
    // actual equivocada al sustituir la credencial (Tabla 24) se informa sin cerrar la sesión.
    if (respuesta.status === 401 && !conservarSesion) alNoAutenticado();
    throw new ErrorDeApi({
      estado: respuesta.status,
      codigo: datos?.codigo,
      detalle: datos?.detail,
      regla: datos?.regla,
    });
  }

  return {
    get: (ruta, opciones) => solicitar("GET", ruta, undefined, opciones),
    post: (ruta, cuerpo, opciones) => solicitar("POST", ruta, cuerpo, opciones),
    put: (ruta, cuerpo, opciones) => solicitar("PUT", ruta, cuerpo, opciones),
    patch: (ruta, cuerpo, opciones) =>
      solicitar("PATCH", ruta, cuerpo, opciones),
    delete: (ruta, cuerpo, opciones) =>
      solicitar("DELETE", ruta, cuerpo, opciones),
  };
}

// Tabla 24 · cada estado del catálogo, con un texto que no distingue lo que la interfaz de
// programación decidió no distinguir y que nunca reproduce el detalle de un fallo interno.
export function mensajeDeError(error) {
  switch (error.estado) {
    case 0:
      return "No fue posible comunicarse con el servidor.";
    case 401:
      return "Credenciales inválidas o sesión vencida.";
    case 403:
      return "El rol de esta cuenta no habilita esta operación.";
    case 404:
      return "El recurso no existe o no está al alcance de esta cuenta.";
    case 409:
      return `${error.detalle || "La operación entra en conflicto con una regla del dominio."}${
        error.regla ? ` (${error.regla})` : ""
      }`;
    case 410:
      return "El código de activación venció, ya fue utilizado o no existe.";
    case 422:
      return error.detalle || "Hay datos que no se pudieron aceptar.";
    default:
      return "No fue posible completar la operación.";
  }
}
