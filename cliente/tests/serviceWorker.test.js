// RF-37 Degradación ante fallo de entrega · CU-14 · RNF-11
// Prueba: CP-RF-37
//
// RF-37 (Tabla 10) · «Ante indisponibilidad del servicio push, ausencia de acuse del
// cliente o falta de soporte del navegador, el sistema debe entregar el aviso dentro de la
// aplicación y registrar la causa.» El service worker presenta el aviso que llega con la
// aplicación cerrada; el registro no debe impedir operar cuando el navegador no lo soporta.
import { registrarServiceWorker } from "../comun/registroServiceWorker.js";

describe("registro del service worker", () => {
  it("lo registra en la raíz cuando el navegador lo soporta", async () => {
    const registro = { scope: "/" };
    const navegador = {
      serviceWorker: { register: jest.fn().mockResolvedValue(registro) },
    };

    await expect(registrarServiceWorker(navegador)).resolves.toBe(registro);
    expect(navegador.serviceWorker.register).toHaveBeenCalledWith(
      "/service-worker.js",
    );
  });

  it("sin soporte del navegador no hace nada ni falla (RNF-11)", async () => {
    await expect(registrarServiceWorker({})).resolves.toBeNull();
  });

  it("un fallo del registro no impide operar: se informa como ausencia", async () => {
    const navegador = {
      serviceWorker: { register: jest.fn().mockRejectedValue(new Error("x")) },
    };

    await expect(registrarServiceWorker(navegador)).resolves.toBeNull();
  });
});

describe("presentación del aviso", () => {
  let mostrar;
  let abrir;

  beforeAll(() => {
    mostrar = jest.fn().mockResolvedValue();
    abrir = jest.fn().mockResolvedValue();
    self.registration = { showNotification: mostrar };
    self.clients = { openWindow: abrir };
    require("../comun/publico/service-worker.js");
  });

  beforeEach(() => jest.clearAllMocks());

  function empujar(datos) {
    const evento = new Event("push");
    evento.data = datos === undefined ? null : { json: () => datos };
    const esperas = [];
    evento.waitUntil = (promesa) => esperas.push(promesa);
    self.dispatchEvent(evento);
    return Promise.all(esperas);
  }

  it("presenta el título y el cuerpo que el servidor envió", async () => {
    await empujar({
      notification: { title: "Primero A", body: "Ana: Mañana hay reunión." },
    });

    expect(mostrar).toHaveBeenCalledWith(
      "Primero A",
      expect.objectContaining({ body: "Ana: Mañana hay reunión." }),
    );
  });

  it("sin carga presenta un aviso genérico en vez de perderlo", async () => {
    await empujar(undefined);

    expect(mostrar).toHaveBeenCalledWith(
      "Plataforma de comunicación escolar",
      expect.objectContaining({ body: "" }),
    );
  });

  it("una carga ilegible tampoco pierde el aviso", async () => {
    const evento = new Event("push");
    evento.data = {
      json: () => {
        throw new Error("no es JSON");
      },
    };
    const esperas = [];
    evento.waitUntil = (p) => esperas.push(p);
    self.dispatchEvent(evento);
    await Promise.all(esperas);

    expect(mostrar).toHaveBeenCalledTimes(1);
  });

  it("al tocarlo abre la aplicación y cierra el aviso", async () => {
    const evento = new Event("notificationclick");
    evento.notification = { close: jest.fn() };
    const esperas = [];
    evento.waitUntil = (p) => esperas.push(p);
    self.dispatchEvent(evento);
    await Promise.all(esperas);

    expect(evento.notification.close).toHaveBeenCalled();
    expect(abrir).toHaveBeenCalledWith("/");
  });
});
