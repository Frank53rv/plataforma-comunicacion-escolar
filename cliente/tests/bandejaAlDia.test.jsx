// RF-37 Degradación ante fallo de entrega · RF-39 · RF-31 · CU-14, CU-09 · RN-18
// Prueba: CP-RF-37 · CP-RF-39
//
// RF-37 (Tabla 10) · «el sistema debe entregar el aviso dentro de la aplicación». Con la
// aplicación abierta, el anuncio publicado llega a la bandeja sin depender del aviso push:
// la bandeja vuelve a consultar GET /anuncios cada treinta segundos mientras se ve, al
// volver a verse y al llegar un aviso push. El acuse de cada versión se emite una sola vez.
import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Bandeja from "../anuncios/Bandeja.jsx";
import { crearApi } from "../comun/api.js";
import { ContextoSesion } from "../comun/contextoSesion.js";
import { panelDe, simularApi } from "./ayudas.js";

const CONSULTA = "GET /anuncios?pagina=1&por_pagina=25";

const fila = (n, extra = {}) => ({
  id: `a${n}`,
  anuncio_version_id: `v${n}`,
  titulo: `Anuncio ${n}`,
  publicado_en: "2026-03-02T15:30:00Z",
  autor: { id: "d1", nombre: "Ana", apellido: "Gómez", rol: "docente" },
  leido: false,
  ...extra,
});

// La primera consulta devuelve un anuncio; las siguientes, además, uno recién publicado.
function simularPublicacion() {
  let consultas = 0;
  return simularApi({
    [CONSULTA]: () => {
      consultas += 1;
      const datos = consultas === 1 ? [fila(1)] : [fila(2), fila(1)];
      return [200, { datos, total: datos.length, pagina: 1, por_pagina: 25 }];
    },
    "POST /entregas/acuses": [
      200,
      { registrada: 1, omitida_por_idempotencia: 0 },
    ],
  });
}

function dibujar(rol = "tutor") {
  return render(
    <ContextoSesion.Provider
      value={{
        panel: panelDe(rol, { cursos: [] }),
        api: crearApi({ obtenerToken: () => "tok" }),
      }}
    >
      <MemoryRouter>
        <Bandeja />
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
}

const consultas = (llamadas) =>
  llamadas.filter((l) => l.clave === CONSULTA).length;

function verse(estado) {
  Object.defineProperty(document, "visibilityState", {
    value: estado,
    configurable: true,
  });
  act(() => void document.dispatchEvent(new Event("visibilitychange")));
}

describe("CP-RF-37 · el anuncio llega a la bandeja abierta", () => {
  let trabajador;

  beforeEach(() => {
    jest.useFakeTimers();
    trabajador = new EventTarget();
    Object.defineProperty(navigator, "serviceWorker", {
      value: trabajador,
      configurable: true,
    });
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    delete navigator.serviceWorker;
  });

  it("a los treinta segundos presenta el anuncio recién publicado sin volver a «Cargando…»", async () => {
    simularPublicacion();
    dibujar();
    await screen.findByRole("link", { name: "Anuncio 1" });

    act(() => void jest.advanceTimersByTime(30_000));

    expect(screen.queryByText("Cargando…")).not.toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: "Anuncio 2" }),
    ).toBeInTheDocument();
  });

  it("no consulta mientras la aplicación no se ve, y consulta al volver a verse", async () => {
    const llamadas = simularPublicacion();
    dibujar();
    await screen.findByRole("link", { name: "Anuncio 1" });

    verse("hidden");
    act(() => void jest.advanceTimersByTime(90_000));
    expect(consultas(llamadas)).toBe(1);

    verse("visible");
    expect(
      await screen.findByRole("link", { name: "Anuncio 2" }),
    ).toBeInTheDocument();
  });

  it("un aviso push con la aplicación abierta la pone al día en el momento", async () => {
    simularPublicacion();
    dibujar("alumno");
    await screen.findByRole("link", { name: "Anuncio 1" });

    act(() => void trabajador.dispatchEvent(new Event("message")));

    expect(
      await screen.findByRole("link", { name: "Anuncio 2" }),
    ).toBeInTheDocument();
  });

  it("el acuse de cada versión se emite una sola vez aunque la consulta se repita", async () => {
    const llamadas = simularPublicacion();
    dibujar();
    await screen.findByRole("link", { name: "Anuncio 1" });

    act(() => void jest.advanceTimersByTime(30_000));
    await screen.findByRole("link", { name: "Anuncio 2" });
    act(() => void jest.advanceTimersByTime(30_000));
    await waitFor(() => expect(consultas(llamadas)).toBe(3));

    const acuses = llamadas
      .filter((l) => l.clave === "POST /entregas/acuses")
      .map((l) => l.cuerpo.anuncio_version_ids);
    expect(acuses).toEqual([["v1"], ["v2"]]);
  });

  it("al salir de la bandeja deja de consultar", async () => {
    const llamadas = simularPublicacion();
    const { unmount } = dibujar();
    await screen.findByRole("link", { name: "Anuncio 1" });

    unmount();
    act(() => void jest.advanceTimersByTime(90_000));
    act(() => void trabajador.dispatchEvent(new Event("message")));

    expect(consultas(llamadas)).toBe(1);
  });
});
