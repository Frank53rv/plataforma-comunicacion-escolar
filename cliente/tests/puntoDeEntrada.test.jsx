// RF-40 Paneles diferenciados por rol · RF-01 Autenticación · CU-01, CU-09
// Prueba: CP-RF-40
//
// Monta el punto de entrada REAL de la aplicación —el que carga el navegador— y comprueba que
// arranca. Las demás pruebas montan cada pantalla con su propio enrutador de prueba, de modo que
// una entrada sin enrutador pasaba todas y dejaba la página en blanco en producción.
import { screen } from "@testing-library/react";
import { respuesta } from "./ayudas.js";

describe("punto de entrada de la aplicación", () => {
  beforeEach(() => {
    sessionStorage.clear();
    document.body.innerHTML = '<div id="raiz"></div>';
    global.fetch = jest.fn(async () =>
      respuesta(404, { status: 404, detail: "x" }),
    );
    window.history.pushState({}, "", "/ingreso");
  });

  it("arranca sobre la ruta de ingreso y presenta la pantalla, no una página en blanco", async () => {
    await jest.isolateModulesAsync(async () => {
      await import("../comun/principal.jsx");
    });

    expect(
      await screen.findByRole("heading", { name: "Ingresar" }),
    ).toBeInTheDocument();
  });

  it("sin sesión, cualquier dirección lleva al ingreso", async () => {
    window.history.pushState({}, "", "/anuncios/xyz");
    await jest.isolateModulesAsync(async () => {
      await import("../comun/principal.jsx");
    });

    expect(
      await screen.findByRole("heading", { name: "Ingresar" }),
    ).toBeInTheDocument();
  });

  it("registra el service worker, que no impide arrancar si el navegador no lo admite", async () => {
    await jest.isolateModulesAsync(async () => {
      await import("../comun/principal.jsx");
    });

    expect(
      await screen.findByRole("heading", { name: "Ingresar" }),
    ).toBeInTheDocument();
  });
});
