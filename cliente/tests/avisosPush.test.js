// RF-37 Degradación ante fallo de entrega · CU-14 · RNF-11
// Prueba: CP-RF-37
//
// RF-37 (Tabla 10) · «Ante indisponibilidad del servicio push, ausencia de acuse del cliente o
// falta de soporte del navegador, el sistema debe entregar el aviso dentro de la aplicación y
// registrar la causa.» RNF-11 · la falta de soporte, de permiso o de configuración no impide
// operar: el cliente no registra la suscripción y la interfaz de programación entrega el aviso
// dentro de la aplicación.
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import {
  admiteAvisos,
  nombreDelNavegador,
  obtenerIdentificadorDeDestino,
} from "../preferencias/avisosPush.js";

jest.mock("firebase/app", () => ({ initializeApp: jest.fn(() => "app") }));
jest.mock("firebase/messaging", () => ({
  getMessaging: jest.fn(() => "mensajeria"),
  getToken: jest.fn(),
  isSupported: jest.fn(),
}));

const CONFIGURACION = {
  VITE_FCM_API_KEY: "clave",
  VITE_FCM_PROJECT_ID: "proyecto",
  VITE_FCM_SENDER_ID: "123",
  VITE_FCM_APP_ID: "app-1",
  VITE_VAPID_PUBLIC_KEY: "vapid",
};

const entornoOriginal = { ...process.env };
let registro;

beforeEach(() => {
  Object.assign(process.env, CONFIGURACION);
  registro = { scope: "/" };
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { ready: Promise.resolve(registro) },
  });
  globalThis.Notification = {
    requestPermission: jest.fn().mockResolvedValue("granted"),
  };
  isSupported.mockResolvedValue(true);
  getToken.mockResolvedValue("token-fcm");
});

afterEach(() => {
  process.env = { ...entornoOriginal };
  delete globalThis.Notification;
  jest.clearAllMocks();
});

describe("soporte del navegador", () => {
  it("admite avisos con notificaciones y service worker", async () => {
    await expect(admiteAvisos()).resolves.toBe(true);
  });

  it("sin notificaciones, no", async () => {
    delete globalThis.Notification;

    await expect(admiteAvisos()).resolves.toBe(false);
  });

  it("sin service worker, no", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: undefined,
    });
    delete navigator.serviceWorker;

    await expect(admiteAvisos()).resolves.toBe(false);
  });

  it("si el SDK dice que el navegador no lo admite, no", async () => {
    isSupported.mockResolvedValue(false);

    await expect(admiteAvisos()).resolves.toBe(false);
  });
});

describe("identificador de destino del navegador", () => {
  it("pide el permiso, obtiene el token con la clave pública VAPID y el service worker propio", async () => {
    await expect(obtenerIdentificadorDeDestino()).resolves.toBe("token-fcm");

    expect(getMessaging).toHaveBeenCalledWith("app");
    expect(getToken).toHaveBeenCalledWith("mensajeria", {
      vapidKey: "vapid",
      serviceWorkerRegistration: registro,
    });
  });

  it("sin el permiso de la persona no obtiene nada", async () => {
    globalThis.Notification.requestPermission.mockResolvedValue("denied");

    await expect(obtenerIdentificadorDeDestino()).rejects.toMatchObject({
      causa: "permiso_denegado",
    });
    expect(getToken).not.toHaveBeenCalled();
  });

  it("sin configuración del servicio de avisos no lo intenta", async () => {
    process.env.VITE_FCM_API_KEY = "";

    await expect(obtenerIdentificadorDeDestino()).rejects.toMatchObject({
      causa: "sin_configuracion",
    });
    expect(globalThis.Notification.requestPermission).not.toHaveBeenCalled();
  });

  it("si el navegador no admite avisos lo informa", async () => {
    isSupported.mockResolvedValue(false);

    await expect(obtenerIdentificadorDeDestino()).rejects.toMatchObject({
      causa: "sin_soporte",
    });
  });

  it("un fallo del servicio de avisos se informa como indisponibilidad, no como excepción cruda", async () => {
    getToken.mockRejectedValue(new Error("messaging/token-subscribe-failed"));

    await expect(obtenerIdentificadorDeDestino()).rejects.toMatchObject({
      causa: "servicio_no_disponible",
    });
  });

  it("un token vacío tampoco es un identificador", async () => {
    getToken.mockResolvedValue("");

    await expect(obtenerIdentificadorDeDestino()).rejects.toMatchObject({
      causa: "servicio_no_disponible",
    });
  });
});

describe("nombre del navegador", () => {
  it.each([
    [
      "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
      "Firefox",
    ],
    [
      "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/128.0 Safari/537.36 Edg/128.0",
      "Edge",
    ],
    [
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36",
      "Chrome",
    ],
    [
      "Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15",
      "Safari",
    ],
    ["algo desconocido", "Navegador"],
  ])("%s → %s", (agente, esperado) => {
    expect(nombreDelNavegador(agente)).toBe(esperado);
  });
});
