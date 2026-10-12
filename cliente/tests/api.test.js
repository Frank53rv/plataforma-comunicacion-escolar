// RF-40 Paneles diferenciados por rol · RF-01 Autenticación · CU-01, CU-09 · RN-15
// Prueba: CP-RF-40 · CP-RF-01
//
// RNF-21 · el cliente no decide nada: pide y presenta. Este es el único punto de acceso HTTP.
// Tabla 24 · los nueve estados del catálogo tienen presentación y ninguno revela detalle
// interno de la interfaz de programación.
import { crearApi, ErrorDeApi, mensajeDeError } from "../comun/api.js";

function respuesta(estado, cuerpo) {
  return {
    ok: estado >= 200 && estado < 300,
    status: estado,
    json: async () => {
      if (cuerpo === undefined) throw new Error("sin cuerpo");
      return cuerpo;
    },
  };
}

describe("cliente HTTP", () => {
  let fetchFalso;

  beforeEach(() => {
    fetchFalso = jest.fn();
    global.fetch = fetchFalso;
  });

  it("pide bajo /api/v1 con el token de la sesión y JSON", async () => {
    fetchFalso.mockResolvedValue(respuesta(200, { rol: "tutor" }));
    const api = crearApi({ obtenerToken: () => "tok" });

    const panel = await api.get("/paneles/me");

    expect(panel).toEqual({ rol: "tutor" });
    const [url, opciones] = fetchFalso.mock.calls[0];
    expect(url).toBe("/api/v1/paneles/me");
    expect(opciones.method).toBe("GET");
    expect(opciones.headers.Authorization).toBe("Bearer tok");
  });

  it("sin sesión no envía cabecera de autorización", async () => {
    fetchFalso.mockResolvedValue(respuesta(200, {}));

    await crearApi().get("/x");

    expect(fetchFalso.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("envía el cuerpo como JSON en las operaciones de escritura", async () => {
    fetchFalso.mockResolvedValue(respuesta(201, { token: "t" }));

    await crearApi().post("/sesiones", { correo: "a@b", contrasena: "x" });

    const [, opciones] = fetchFalso.mock.calls[0];
    expect(opciones.method).toBe("POST");
    expect(JSON.parse(opciones.body)).toEqual({
      correo: "a@b",
      contrasena: "x",
    });
    expect(opciones.headers["Content-Type"]).toBe("application/json");
  });

  it.each([
    ["put", "PUT"],
    ["patch", "PATCH"],
    ["delete", "DELETE"],
  ])("%s usa el método %s", async (nombre, metodo) => {
    fetchFalso.mockResolvedValue(respuesta(200, {}));

    await crearApi()[nombre]("/x", nombre === "delete" ? undefined : { a: 1 });

    expect(fetchFalso.mock.calls[0][1].method).toBe(metodo);
  });

  it("una respuesta sin cuerpo (204) devuelve null", async () => {
    fetchFalso.mockResolvedValue(respuesta(204));

    await expect(crearApi().delete("/sesiones")).resolves.toBeNull();
  });

  it("traduce el cuerpo de error de la interfaz a un ErrorDeApi", async () => {
    fetchFalso.mockResolvedValue(
      respuesta(409, {
        status: 409,
        detail: "Ya hay un titular.",
        codigo: "conflicto",
        regla: "RN-13",
      }),
    );

    const error = await crearApi()
      .post("/x", {})
      .catch((e) => e);

    expect(error).toBeInstanceOf(ErrorDeApi);
    expect(error).toMatchObject({
      estado: 409,
      detalle: "Ya hay un titular.",
      regla: "RN-13",
    });
  });

  it("un 401 avisa a la sesión para que se cierre", async () => {
    fetchFalso.mockResolvedValue(respuesta(401, { status: 401, detail: "x" }));
    const alNoAutenticado = jest.fn();

    await crearApi({ alNoAutenticado })
      .get("/x")
      .catch(() => {});

    expect(alNoAutenticado).toHaveBeenCalledTimes(1);
  });

  it("un 401 donde la interfaz lo usa para otra cosa se informa sin cerrar la sesión", async () => {
    fetchFalso.mockResolvedValue(respuesta(401, { status: 401, detail: "x" }));
    const alNoAutenticado = jest.fn();

    const error = await crearApi({ alNoAutenticado })
      .patch("/usuarios/me/contrasena", {}, { conservarSesion: true })
      .catch((e) => e);

    expect(error).toMatchObject({ estado: 401 });
    expect(alNoAutenticado).not.toHaveBeenCalled();
  });

  it("un fallo de red se presenta como error de comunicación, no como excepción cruda", async () => {
    fetchFalso.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await crearApi()
      .get("/x")
      .catch((e) => e);

    expect(error).toMatchObject({ estado: 0 });
    expect(mensajeDeError(error)).toMatch(/comunicar/);
  });

  it("una respuesta de error sin cuerpo legible sigue siendo un ErrorDeApi", async () => {
    fetchFalso.mockResolvedValue(respuesta(500));

    const error = await crearApi()
      .get("/x")
      .catch((e) => e);

    expect(error).toMatchObject({ estado: 500 });
  });
});

describe("presentación de los errores del catálogo (Tabla 24)", () => {
  const de = (estado, extra = {}) =>
    mensajeDeError(new ErrorDeApi({ estado, ...extra }));

  it("401 no distingue qué falló", () =>
    expect(de(401)).toMatch(/sesión|credencial/i));
  it("403 explica que el rol no habilita", () =>
    expect(de(403)).toMatch(/no habilita/i));
  it("404 se presenta como inexistente, sin revelar que existe (RN-15)", () =>
    expect(de(404)).toMatch(/no existe o no está al alcance/i));
  it("409 consigna el código de la regla", () =>
    expect(de(409, { detalle: "Ya hay un titular.", regla: "RN-13" })).toBe(
      "Ya hay un titular. (RN-13)",
    ));
  it("410 es el código de activación vencido, usado o inexistente", () =>
    expect(de(410)).toMatch(/código de activación/i));
  it("422 presenta el detalle de los datos inaceptables", () =>
    expect(de(422, { detalle: "El correo ya está registrado." })).toBe(
      "El correo ya está registrado.",
    ));
  it("422 sin detalle usa un texto genérico", () =>
    expect(de(422)).toMatch(/datos/i));
  it("500 es un mensaje genérico que no expone nada interno", () => {
    const mensaje = de(500, {
      detalle: "PG::ConnectionBad en app/models/x.rb:12",
    });
    expect(mensaje).toBe("No fue posible completar la operación.");
  });
});
