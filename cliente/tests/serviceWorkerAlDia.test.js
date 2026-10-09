// RF-37 Degradación ante fallo de entrega · RF-31 · CU-14 · RNF-11
// Prueba: CP-RF-37
//
// Con la aplicación abierta, el aviso push además avisa a sus ventanas para que la bandeja
// se ponga al día en el momento; presentarlo sigue igual.
describe("aviso push con la aplicación abierta", () => {
  let mostrar;
  let ventana;

  beforeAll(() => {
    mostrar = jest.fn().mockResolvedValue();
    ventana = { postMessage: jest.fn() };
    self.registration = { showNotification: mostrar };
    self.clients = {
      openWindow: jest.fn(),
      matchAll: jest.fn().mockResolvedValue([ventana]),
    };
    require("../comun/publico/service-worker.js");
  });

  it("avisa a las ventanas abiertas y presenta el aviso", async () => {
    const evento = new Event("push");
    evento.data = { json: () => ({ notification: { title: "Primero A" } }) };
    const esperas = [];
    evento.waitUntil = (promesa) => esperas.push(promesa);
    self.dispatchEvent(evento);
    await Promise.all(esperas);

    expect(self.clients.matchAll).toHaveBeenCalledWith({
      type: "window",
      includeUncontrolled: true,
    });
    expect(ventana.postMessage).toHaveBeenCalledWith({ tipo: "aviso" });
    expect(mostrar).toHaveBeenCalledWith("Primero A", expect.any(Object));
  });
});
