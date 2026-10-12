// RF-31 Notificación de anuncios · CU-06, CU-14 · RN-18
// Prueba: CP-RF-31
//
// Tabla 23 · la instalación es la condición de la recepción del aviso push en iOS (R-03). En el
// iPhone sólo se instala desde el menú Compartir, y esa opción no existe en el navegador
// interno de otras aplicaciones ni en todas las versiones de los navegadores que no son
// Safari: la indicación tiene que decir dónde está la opción y, fuera de Safari, que se abra la
// página ahí.
import fs from "node:fs";
import path from "node:path";
import { act, fireEvent, render, screen } from "@testing-library/react";
import BotonDeInstalacion from "../comun/BotonDeInstalacion.jsx";
import { navegadorDeIOS } from "../comun/instalacion.js";

const SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const CHROME_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1";
const INSTAGRAM =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0";

function conAgente(agente) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", {
    value: { ...globalThis.navigator, userAgent: agente, standalone: false },
    configurable: true,
  });
  return () => Object.defineProperty(globalThis, "navigator", original);
}

async function abrirGuia() {
  render(<BotonDeInstalacion />);
  await act(
    async () =>
      void fireEvent.click(
        screen.getByRole("button", { name: "Instalar aplicación" }),
      ),
  );
  return screen.getByRole("status");
}

describe("CP-RF-31 · instalación en el iPhone", () => {
  let restaurar = () => {};
  afterEach(() => restaurar());

  it("distingue Safari de los demás navegadores del iPhone", () => {
    expect(navegadorDeIOS(SAFARI)).toBe("safari");
    expect(navegadorDeIOS(CHROME_IOS)).toBe("otro");
    expect(navegadorDeIOS(INSTAGRAM)).toBe("otro");
  });

  it("en Safari dice dónde está la opción y qué hacer si no aparece", async () => {
    restaurar = conAgente(SAFARI);

    const guia = await abrirGuia();

    expect(guia).toHaveTextContent(/Compartir/);
    expect(guia).toHaveTextContent(/Agregar a pantalla de inicio/);
    expect(guia).toHaveTextContent(/Editar acciones/);
  });

  it.each([
    ["Chrome", CHROME_IOS],
    ["el navegador interno de otra aplicación", INSTAGRAM],
  ])("en %s pide abrir la página en Safari", async (_nombre, agente) => {
    restaurar = conAgente(agente);

    const guia = await abrirGuia();

    expect(guia).toHaveTextContent(/abrí esta página en Safari/);
    expect(guia).toHaveTextContent(/Agregar a pantalla de inicio/);
  });

  it("la página declara el ícono y el modo de pantalla completa que usa iOS", () => {
    const html = fs.readFileSync(
      path.resolve(__dirname, "..", "index.html"),
      "utf8",
    );

    expect(html).toMatch(/<link[^>]+rel="apple-touch-icon"[^>]+href="\/icono-/);
    expect(html).toMatch(
      /name="apple-mobile-web-app-capable"[^>]+content="yes"/,
    );
    expect(html).toMatch(/name="apple-mobile-web-app-title"/);
  });
});
