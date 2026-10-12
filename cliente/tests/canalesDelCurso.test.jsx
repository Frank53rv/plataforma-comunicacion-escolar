// RF-25 Canal grupal del curso · RF-29 Restricción de participación · CU-12 · RN-23
// Prueba: CP-RF-25 · CP-RF-29
//
// Tabla 18 · GET /cursos/{id}/conversaciones · docente, tutor, alumno · «las conversaciones del
// curso visibles para el rol, con tipo y estado» (Tabla 29). El alumno lo tiene autorizado pero
// recibe la colección vacía: el canal de RF-25 es de docentes y tutores (RF-24 es Should have).
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import CanalesDelCurso from "../conversacion/CanalesDelCurso.jsx";
import { crearApi } from "../comun/api.js";
import { ContextoSesion } from "../comun/contextoSesion.js";
import { panelDe, simularApi } from "./ayudas.js";

const CANALES = "GET /cursos/c1/conversaciones";
const canal = (extra = {}) => ({
  id: "k1",
  curso_id: "c1",
  tipo: "grupal_de_tutores",
  estado: "activa",
  ...extra,
});

function dibujar(estado) {
  const valor = {
    panel: panelDe("docente", { cursos: [{ id: "c1", nombre: "Primero A" }] }),
    sesion: { usuario_id: "yo", token: "tok" },
    api: crearApi({ obtenerToken: () => "tok" }),
  };
  return render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter
        initialEntries={[{ pathname: "/cursos/c1/canal", state: estado }]}
      >
        <Routes>
          <Route path="/cursos/:id/canal" element={<CanalesDelCurso />} />
        </Routes>
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
}

const coleccion = (datos) => [
  200,
  { datos, total: datos.length, pagina: 1, por_pagina: 25 },
];

describe("CP-RF-25 · los canales de un curso", () => {
  it("presenta el canal grupal del curso con su estado y un enlace para abrirlo", async () => {
    simularApi({ [CANALES]: coleccion([canal()]) });
    dibujar();

    expect(
      await screen.findByRole("heading", { name: "Canal grupal · Primero A" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Abrir el canal grupal" }),
    ).toHaveAttribute("href", "/conversaciones/k1");
  });

  it("un canal en sólo lectura se declara como tal", async () => {
    simularApi({ [CANALES]: coleccion([canal({ estado: "solo_lectura" })]) });
    dibujar();

    expect(await screen.findByText("Sólo lectura")).toBeInTheDocument();
  });

  it("si la cuenta no tiene canal en ese curso lo dice, sin sugerir una función ausente", async () => {
    simularApi({ [CANALES]: coleccion([]) });
    dibujar();

    expect(
      await screen.findByText(
        "Este curso no tiene un canal grupal para esta cuenta.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Abrir el canal grupal" }),
    ).not.toBeInTheDocument();
  });

  it("un curso al que no está vinculado responde 403 y se presenta como tal (RF-29)", async () => {
    simularApi({ [CANALES]: [403, { status: 403, detail: "x" }] });
    dibujar();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El rol de esta cuenta no habilita esta operación.",
    );
  });

  it("un error se presenta sin detalle interno", async () => {
    simularApi({ [CANALES]: [500, { status: 500, detail: "PG::Error" }] });
    dibujar();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No fue posible completar la operación.",
    );
  });

  it("mientras llega lo indica", () => {
    global.fetch = jest.fn(() => new Promise(() => {}));
    dibujar();

    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });
});
