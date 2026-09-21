// RF-23 Constancias de lectura · CU-11 · RN-21
// Prueba: CP-RF-23
//
// TC-13 (Tabla 17) · «Consultar las constancias de lectura de un anuncio propio». RN-21 ·
// «El docente ve, por anuncio, cuántos leyeron sobre el total y la nómina de quiénes no.
// Tutores y alumnos no ven la constancia de nadie más.» RF-38 (familia alcanzada) es Should
// have: no se presenta.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import Constancias from "../paneles/docente/Constancias.jsx";
import ListadoDeConstancias from "../paneles/docente/ListadoDeConstancias.jsx";
import { crearApi } from "../comun/api.js";
import { ContextoSesion } from "../comun/contextoSesion.js";
import { panelDe, simularApi } from "./ayudas.js";

function dibujar(ruta) {
  const valor = {
    panel: panelDe("docente"),
    sesion: { usuario_id: "yo" },
    api: crearApi({ obtenerToken: () => "tok" }),
  };
  return render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/constancias" element={<ListadoDeConstancias />} />
          <Route path="/anuncios/:id/constancias" element={<Constancias />} />
          <Route path="/anuncios/:id" element={<p>detalle</p>} />
        </Routes>
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
}

const mios = (n) => ({
  id: `a${n}`,
  anuncio_version_id: `v${n}`,
  titulo: `Anuncio ${n}`,
  publicado_en: "2026-03-02T15:30:00Z",
  autor: { id: "yo", nombre: "Ana", apellido: "Gómez", rol: "docente" },
  leido: false,
});
const alumno = (n) => ({
  alumno: { id: `al${n}`, nombre: `Alumno${n}`, apellido: "Pérez" },
});

describe("CP-RF-23 · los anuncios propios, para llegar a su constancia", () => {
  it("lista sólo los anuncios publicados por la persona, con el filtro remitente de la interfaz", async () => {
    const llamadas = simularApi({
      "GET /anuncios?remitente_id=yo&pagina=1&por_pagina=25": [
        200,
        { datos: [mios(1), mios(2)], total: 2, pagina: 1, por_pagina: 25 },
      ],
    });
    dibujar("/constancias");

    const enlace = await screen.findByRole("link", {
      name: "Constancia de «Anuncio 1»",
    });
    expect(enlace).toHaveAttribute("href", "/anuncios/a1/constancias");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(llamadas[0].clave).toBe(
      "GET /anuncios?remitente_id=yo&pagina=1&por_pagina=25",
    );
  });

  it("sin anuncios propios lo dice", async () => {
    simularApi({
      "GET /anuncios?remitente_id=yo&pagina=1&por_pagina=25": [
        200,
        { datos: [], total: 0, pagina: 1, por_pagina: 25 },
      ],
    });
    dibujar("/constancias");

    expect(
      await screen.findByText("Todavía no publicó ningún anuncio."),
    ).toBeInTheDocument();
  });

  it("pagina", async () => {
    simularApi({
      "GET /anuncios?remitente_id=yo&pagina=1&por_pagina=25": [
        200,
        { datos: [mios(1)], total: 30, pagina: 1, por_pagina: 25 },
      ],
      "GET /anuncios?remitente_id=yo&pagina=2&por_pagina=25": [
        200,
        { datos: [mios(26)], total: 30, pagina: 2, por_pagina: 25 },
      ],
    });
    dibujar("/constancias");
    await screen.findByText("Anuncio 1");

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(await screen.findByText("Anuncio 26")).toBeInTheDocument();
  });

  it("un error se presenta sin detalle interno", async () => {
    simularApi({
      "GET /anuncios?remitente_id=yo&pagina=1&por_pagina=25": [
        500,
        { status: 500, detail: "PG::Error" },
      ],
    });
    dibujar("/constancias");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No fue posible completar la operación.",
    );
  });

  it("mientras llega lo indica", () => {
    global.fetch = jest.fn(() => new Promise(() => {}));
    dibujar("/constancias");

    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });
});

describe("CP-RF-23 · constancia de un anuncio", () => {
  it("presenta cuántos leyeron sobre el total y la nómina de quiénes no", async () => {
    simularApi({
      "GET /anuncios/a1/constancias?pagina=1&por_pagina=25": [
        200,
        {
          total_destinatarios: 8,
          con_lectura_registrada: 5,
          sin_lectura: [alumno(1), alumno(2), alumno(3)],
          total: 3,
          pagina: 1,
          por_pagina: 25,
        },
      ],
    });
    dibujar("/anuncios/a1/constancias");

    expect(
      await screen.findByText("5 de 8 destinatarios registraron lectura."),
    ).toBeInTheDocument();
    const nomina = within(
      screen.getByRole("list", { name: "Alumnos sin lectura registrada" }),
    );
    expect(nomina.getAllByRole("listitem").map((li) => li.textContent)).toEqual(
      ["Alumno1 Pérez", "Alumno2 Pérez", "Alumno3 Pérez"],
    );
  });

  it("si todos leyeron lo dice en lugar de mostrar una nómina vacía", async () => {
    simularApi({
      "GET /anuncios/a1/constancias?pagina=1&por_pagina=25": [
        200,
        {
          total_destinatarios: 8,
          con_lectura_registrada: 8,
          sin_lectura: [],
          total: 0,
          pagina: 1,
          por_pagina: 25,
        },
      ],
    });
    dibujar("/anuncios/a1/constancias");

    expect(
      await screen.findByText("Todos los destinatarios registraron lectura."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: "Alumnos sin lectura registrada" }),
    ).not.toBeInTheDocument();
  });

  it("si los alumnos leyeron pero algún tutor no, lo distingue de «todos leyeron»", async () => {
    simularApi({
      "GET /anuncios/a1/constancias?pagina=1&por_pagina=25": [
        200,
        {
          total_destinatarios: 8,
          con_lectura_registrada: 7,
          sin_lectura: [],
          total: 0,
          pagina: 1,
          por_pagina: 25,
        },
      ],
    });
    dibujar("/anuncios/a1/constancias");

    expect(
      await screen.findByText("No hay alumnos sin lectura registrada."),
    ).toBeInTheDocument();
  });

  it("no presenta la familia alcanzada: RF-38 es Should have", async () => {
    simularApi({
      "GET /anuncios/a1/constancias?pagina=1&por_pagina=25": [
        200,
        {
          total_destinatarios: 2,
          con_lectura_registrada: 0,
          sin_lectura: [alumno(1)],
          total: 1,
          pagina: 1,
          por_pagina: 25,
        },
      ],
    });
    dibujar("/anuncios/a1/constancias");
    await screen.findByText(/registraron lectura/);

    expect(screen.queryByText(/familia/i)).not.toBeInTheDocument();
  });

  it("pagina la nómina", async () => {
    simularApi({
      "GET /anuncios/a1/constancias?pagina=1&por_pagina=25": [
        200,
        {
          total_destinatarios: 60,
          con_lectura_registrada: 0,
          sin_lectura: [alumno(1)],
          total: 30,
          pagina: 1,
          por_pagina: 25,
        },
      ],
      "GET /anuncios/a1/constancias?pagina=2&por_pagina=25": [
        200,
        {
          total_destinatarios: 60,
          con_lectura_registrada: 0,
          sin_lectura: [alumno(26)],
          total: 30,
          pagina: 2,
          por_pagina: 25,
        },
      ],
    });
    dibujar("/anuncios/a1/constancias");
    await screen.findByText("Alumno1 Pérez");

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(await screen.findByText("Alumno26 Pérez")).toBeInTheDocument();
  });

  it("la constancia de un anuncio ajeno responde 403 y se presenta como tal (CU-11 E1)", async () => {
    simularApi({
      "GET /anuncios/a1/constancias?pagina=1&por_pagina=25": [
        403,
        { status: 403, detail: "x" },
      ],
    });
    dibujar("/anuncios/a1/constancias");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El rol de esta cuenta no habilita esta operación.",
    );
  });

  it("permite volver al anuncio", async () => {
    simularApi({
      "GET /anuncios/a1/constancias?pagina=1&por_pagina=25": [
        200,
        {
          total_destinatarios: 1,
          con_lectura_registrada: 1,
          sin_lectura: [],
          total: 0,
          pagina: 1,
          por_pagina: 25,
        },
      ],
    });
    dibujar("/anuncios/a1/constancias");

    expect(
      await screen.findByRole("link", { name: "Volver al anuncio" }),
    ).toHaveAttribute("href", "/anuncios/a1");
  });

  it("mientras llega lo indica", () => {
    global.fetch = jest.fn(() => new Promise(() => {}));
    dibujar("/anuncios/a1/constancias");

    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });
});
