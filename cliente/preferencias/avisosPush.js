// RF-37 Degradación ante fallo de entrega · CU-14 · RNF-11
// Prueba: CP-RF-37
//
// Tabla 23 · Firebase Cloud Messaging es el único componente externo, y «su indisponibilidad
// no impide operar» (RNF-11). Acá se obtiene el identificador de destino del navegador que la
// interfaz de programación usa para enviar (POST /suscripciones-push). Cuando no se puede
// —falta de soporte, de permiso, de configuración o servicio caído— se informa la causa y no
// se registra nada: la interfaz entrega el aviso dentro de la aplicación y registra el motivo.
// El SDK se carga sólo cuando se lo necesita, para no sumarlo al arranque.
export class ErrorDeAvisos extends Error {
  constructor(causa) {
    super(causa);
    this.causa = causa;
  }
}

// Tabla 30 · valores de construcción del cliente. Vite reemplaza estas expresiones al
// construir (vite.config.js, `define`); en las pruebas son variables de entorno reales.
function configuracion() {
  const claves = {
    apiKey: process.env.VITE_FCM_API_KEY,
    projectId: process.env.VITE_FCM_PROJECT_ID,
    messagingSenderId: process.env.VITE_FCM_SENDER_ID,
    appId: process.env.VITE_FCM_APP_ID,
  };
  const vapid = process.env.VITE_VAPID_PUBLIC_KEY;
  return Object.values(claves).every(Boolean) && vapid
    ? { claves, vapid }
    : null;
}

export async function admiteAvisos() {
  if (typeof Notification === "undefined" || !navigator.serviceWorker)
    return false;
  const { isSupported } = await import("firebase/messaging");
  return isSupported();
}

export async function obtenerIdentificadorDeDestino() {
  const datos = configuracion();
  if (!datos) throw new ErrorDeAvisos("sin_configuracion");
  if (!(await admiteAvisos())) throw new ErrorDeAvisos("sin_soporte");
  if ((await Notification.requestPermission()) !== "granted")
    throw new ErrorDeAvisos("permiso_denegado");

  try {
    const [{ initializeApp }, { getMessaging, getToken }] = await Promise.all([
      import("firebase/app"),
      import("firebase/messaging"),
    ]);
    const registro = await navigator.serviceWorker.ready;
    const token = await getToken(getMessaging(initializeApp(datos.claves)), {
      vapidKey: datos.vapid,
      serviceWorkerRegistration: registro,
    });
    if (!token) throw new Error("sin token");
    return token;
  } catch {
    throw new ErrorDeAvisos("servicio_no_disponible");
  }
}

// Tabla 14 · `navegador` es una etiqueta de hasta 80 caracteres.
export function nombreDelNavegador(agente = navigator.userAgent) {
  if (/Edg\//.test(agente)) return "Edge";
  if (/Firefox\//.test(agente)) return "Firefox";
  if (/Chrome\//.test(agente)) return "Chrome";
  if (/Safari\//.test(agente)) return "Safari";
  return "Navegador";
}
