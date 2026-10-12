// RF-39 Bandeja de anuncios como vista de entrada · RF-40 Paneles diferenciados por rol · CU-09
// · RN-15
// Prueba: CP-RF-39 · CP-RF-40
//
// Una bandeja vacía orienta según el rol: a quien recibe anuncios le dice qué esperar, y a quien
// puede publicarlos le ofrece el camino sólo si la interfaz de programación habilitó esa opción
// en el panel (RNF-21): el cliente no decide permisos.
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import Bandeja from "../anuncios/Bandeja.jsx";
import { crearApi } from "../comun/api.js";
import { ContextoSesion } from "../comun/contextoSesion.js";
import { panelDe, simularApi } from "./ayudas.js";

const vacia = [200, { datos: [], total: 0, pagina: 1, por_pagina: 25 }];

function dibujar(rol, extraPanel = {}) {
  const valor = {
    panel: panelDe(rol, {
      cursos: [{ id: "c1", nombre: "Primero A" }],
      ...extraPanel,
    }),
    api: crearApi({ obtenerToken: () => "tok" }),
  };
  return render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Bandeja />} />
          <Route path="/publicar" element={<p>pantalla de publicar</p>} />
        </Routes>
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
}

describe("CP-RF-39 · bandeja vacía según el rol", () => {
  beforeEach(() => {
    simularApi({ "GET /anuncios?pagina=1&por_pagina=25": vacia });
  });

  it.each(["tutor", "alumno"])(
    "a %s le dice que los anuncios de su curso aparecerán acá",
    async (rol) => {
      dibujar(rol);

      expect(
        await screen.findByText(
          "Los anuncios que publiquen los docentes de tu curso aparecerán acá.",
        ),
      ).toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    },
  );

  it("al docente le ofrece publicar un anuncio cuando la interfaz habilitó esa opción", async () => {
    dibujar("docente", {
      opciones_habilitadas: ["anuncios", "publicar_anuncio"],
    });

    expect(
      await screen.findByText("Los anuncios que publiques aparecerán acá."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Publicar un anuncio" }));
    expect(screen.getByText("pantalla de publicar")).toBeInTheDocument();
  });

  it("no ofrece publicar si la interfaz no habilitó la opción, sea cual sea el rol", async () => {
    dibujar("docente", { opciones_habilitadas: ["anuncios"] });

    await screen.findByText("No hay anuncios para los filtros elegidos.");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("al directivo le dice que los anuncios de los docentes aparecerán acá", async () => {
    dibujar("directivo");

    expect(
      await screen.findByText(
        "Los anuncios que publiquen los docentes aparecerán acá.",
      ),
    ).toBeInTheDocument();
  });

  it("conserva la frase de siempre en todos los roles", async () => {
    dibujar("tutor");

    expect(
      await screen.findByText("No hay anuncios para los filtros elegidos."),
    ).toBeInTheDocument();
  });

  it("con filtros aplicados sugiere probar con otros en lugar de prometer anuncios", async () => {
    simularApi({
      "GET /anuncios?pagina=1&por_pagina=25": vacia,
      "GET /anuncios?curso_id=c1&pagina=1&por_pagina=25": vacia,
    });
    dibujar("tutor");
    await screen.findByText("No hay anuncios para los filtros elegidos.");

    fireEvent.change(screen.getByLabelText("Curso"), {
      target: { value: "c1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Filtrar" }));

    expect(
      await screen.findByText("Probar con otros filtros muestra más anuncios."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/aparecerán acá/)).not.toBeInTheDocument();
  });
});
