// RF-03 Alta de docentes · RF-05 · RF-07 Regeneración del código de activación · RF-15
// Asignación de docentes a cursos · RF-44 Desvinculación · CU-04 · RN-06, RN-13
// Prueba: CP-RF-03 · CP-RF-05 · CP-RF-07 · CP-RF-15 · CP-RF-44
//
// TC-03, TC-04 y TC-05 (Tabla 17) · dar de alta a un docente y asignarlo a un curso como
// titular, regenerar su código de activación, y desvincularlo designando otro titular en el
// mismo acto. RN-13 · un curso tiene un titular vigente. RNF-14 · toda acción destructiva pide
// confirmación explícita. El código de activación se muestra una sola vez (Tabla 29, RN-06).
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { crearApi } from "../comun/api.js";
import { ContextoSesion } from "../comun/contextoSesion.js";
import Docentes from "../paneles/directivo/Docentes.jsx";
import { cursoConNomina, panelDe, persona, simularApi } from "./ayudas.js";

const CURSOS = "GET /cursos?pagina=1&por_pagina=100";
const lista = (cursos) => [
  200,
  { datos: cursos, total: cursos.length, pagina: 1, por_pagina: 100 },
];
const codigo = (extra = {}) => ({
  id: "cod1",
  usuario_id: "x",
  vence_en: "2026-03-09T15:30:00Z",
  codigo: "ABCD-EFGH",
  ...extra,
});

function dibujar() {
  const valor = {
    panel: panelDe("directivo", {
      opciones_habilitadas: [
        "anuncios",
        "anios_lectivos",
        "cursos",
        "docentes",
        "alumnos",
      ],
    }),
    sesion: { usuario_id: "dir" },
    api: crearApi({ obtenerToken: () => "tok" }),
  };
  return render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter>
        <Docentes />
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
}

const escribir = (etiqueta, valor) =>
  fireEvent.change(screen.getByLabelText(etiqueta), {
    target: { value: valor },
  });

describe("CP-RF-03 · los docentes por curso", () => {
  it("lista, por curso, sus docentes con quién es titular", async () => {
    simularApi({ [CURSOS]: lista([cursoConNomina()]) });
    dibujar();

    const seccion = await screen.findByRole("region", { name: "Primero A" });
    const filas = within(seccion).getAllByRole("listitem");
    expect(filas[0]).toHaveTextContent("Ana Zárate");
    expect(filas[0]).toHaveTextContent("Titular");
    expect(filas[1]).toHaveTextContent("Luis Acosta");
    expect(filas[1]).not.toHaveTextContent("Titular");
  });

  it("un curso sin docentes lo dice", async () => {
    simularApi({ [CURSOS]: lista([cursoConNomina({ docentes: [] })]) });
    dibujar();

    expect(
      await screen.findByText("Sin docentes vinculados."),
    ).toBeInTheDocument();
  });

  it("sin cursos lo dice", async () => {
    simularApi({ [CURSOS]: lista([]) });
    dibujar();

    expect(
      await screen.findByText("Todavía no hay cursos."),
    ).toBeInTheDocument();
  });

  it("un error se presenta sin detalle interno", async () => {
    simularApi({ [CURSOS]: [500, { status: 500, detail: "PG::Error" }] });
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

  it("los docentes dados de baja figuran marcados y sin acciones", async () => {
    const baja = persona("d3", "Rosa", "Baja", {
      estado: "dado_de_baja",
      es_titular: false,
    });
    simularApi({
      [CURSOS]: lista([
        cursoConNomina({
          docentes: [
            persona("d1", "Ana", "Zárate", { es_titular: true }),
            baja,
          ],
        }),
      ]),
    });
    dibujar();

    const seccion = await screen.findByRole("region", { name: "Primero A" });
    const fila = within(seccion).getAllByRole("listitem")[1];
    expect(fila).toHaveTextContent("Dado de baja");
    expect(within(fila).queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("CP-RF-03 · alta de un docente", () => {
  it("lo da de alta y presenta su código de activación, una sola vez", async () => {
    const llamadas = simularApi({
      [CURSOS]: lista([cursoConNomina()]),
      "POST /docentes": [
        201,
        {
          usuario: persona("d9", "Nora", "Nueva", { estado: "pendiente" }),
          codigo_activacion: codigo(),
        },
      ],
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    escribir("Nombre", "Nora");
    escribir("Apellido", "Nueva");
    escribir("Correo", "nora@ejemplo.test");
    fireEvent.click(screen.getByRole("button", { name: "Dar de alta" }));

    expect(
      await screen.findByText(/Código de activación de Nora Nueva: ABCD-EFGH/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Se muestra una sola vez/)).toBeInTheDocument();
    expect(llamadas.find((l) => l.clave === "POST /docentes").cuerpo).toEqual({
      nombre: "Nora",
      apellido: "Nueva",
      correo: "nora@ejemplo.test",
    });

    fireEvent.click(screen.getByRole("button", { name: "Entendido" }));
    expect(
      screen.queryByText(/Código de activación de Nora/),
    ).not.toBeInTheDocument();
  });

  it("el docente recién dado de alta queda disponible para vincularlo a un curso", async () => {
    simularApi({
      [CURSOS]: lista([cursoConNomina({ docentes: [] })]),
      "POST /docentes": [
        201,
        {
          usuario: persona("d9", "Nora", "Nueva", { estado: "pendiente" }),
          codigo_activacion: codigo(),
        },
      ],
    });
    dibujar();
    await screen.findByText("Sin docentes vinculados.");
    escribir("Nombre", "Nora");
    escribir("Apellido", "Nueva");
    escribir("Correo", "nora@ejemplo.test");
    fireEvent.click(screen.getByRole("button", { name: "Dar de alta" }));
    await screen.findByText(/Código de activación de Nora/);

    const opciones = within(screen.getByLabelText("Docente"))
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(opciones).toContain("Nora Nueva");
  });

  it("un correo ya registrado lo informa la interfaz y se presenta", async () => {
    simularApi({
      [CURSOS]: lista([cursoConNomina()]),
      "POST /docentes": [
        422,
        { status: 422, detail: "El correo ya está registrado." },
      ],
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    escribir("Nombre", "N");
    escribir("Apellido", "A");
    escribir("Correo", "repetido@ejemplo.test");
    fireEvent.click(screen.getByRole("button", { name: "Dar de alta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El correo ya está registrado.",
    );
  });
});

describe("CP-RF-15 · vincular un docente a un curso", () => {
  const preparar = async (extra = {}) => {
    const llamadas = simularApi({
      [CURSOS]: lista([
        cursoConNomina({
          docentes: [persona("d1", "Ana", "Zárate", { es_titular: true })],
        }),
      ]),
      ...extra,
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });
    return llamadas;
  };

  it("sólo ofrece los docentes que todavía no están en el curso", async () => {
    const otro = cursoConNomina({
      id: "c2",
      nombre: "Segundo B",
      docentes: [persona("d5", "Pablo", "Otro", { es_titular: true })],
    });
    simularApi({
      [CURSOS]: lista([
        cursoConNomina({
          docentes: [persona("d1", "Ana", "Zárate", { es_titular: true })],
        }),
        otro,
      ]),
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    fireEvent.change(screen.getByLabelText("Curso"), {
      target: { value: "c1" },
    });

    const opciones = within(screen.getByLabelText("Docente"))
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(opciones).toEqual(["Elegir…", "Pablo Otro"]);
  });

  it("vincula a un docente como titular y recarga la nómina", async () => {
    const otro = cursoConNomina({
      id: "c2",
      nombre: "Segundo B",
      docentes: [persona("d5", "Pablo", "Otro", { es_titular: true })],
    });
    const llamadas = simularApi({
      [CURSOS]: lista([cursoConNomina({ docentes: [] }), otro]),
      "POST /cursos/c1/docentes": [
        201,
        { id: "v1", usuario_id: "d5", curso_id: "c1", es_titular: true },
      ],
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    fireEvent.change(screen.getByLabelText("Curso"), {
      target: { value: "c1" },
    });
    fireEvent.change(screen.getByLabelText("Docente"), {
      target: { value: "d5" },
    });
    fireEvent.click(screen.getByLabelText("Titular del curso"));
    fireEvent.click(screen.getByRole("button", { name: "Vincular" }));

    expect(
      await screen.findByText("Docente vinculado a «Primero A»."),
    ).toBeInTheDocument();
    expect(
      llamadas.find((l) => l.clave === "POST /cursos/c1/docentes").cuerpo,
    ).toEqual({ usuario_id: "d5", es_titular: true });
    await waitFor(() =>
      expect(llamadas.filter((l) => l.clave === CURSOS).length).toBeGreaterThan(
        1,
      ),
    );
  });

  it("un segundo titular responde 409 con la regla RN-13 y se presenta tal cual", async () => {
    const otro = cursoConNomina({
      id: "c2",
      nombre: "Segundo B",
      docentes: [persona("d5", "Pablo", "Otro", { es_titular: true })],
    });
    simularApi({
      [CURSOS]: lista([cursoConNomina(), otro]),
      "POST /cursos/c1/docentes": [
        409,
        {
          status: 409,
          detail: "El curso ya tiene un titular vigente.",
          regla: "RN-13",
        },
      ],
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    fireEvent.change(screen.getByLabelText("Curso"), {
      target: { value: "c1" },
    });
    fireEvent.change(screen.getByLabelText("Docente"), {
      target: { value: "d5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Vincular" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El curso ya tiene un titular vigente. (RN-13)",
    );
  });

  it("sin elegir docente y curso no pide nada", async () => {
    const llamadas = await preparar();

    fireEvent.click(screen.getByRole("button", { name: "Vincular" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Elegir un docente y un curso.",
    );
    expect(llamadas.some((l) => l.clave.startsWith("POST"))).toBe(false);
  });
});

describe("CP-RF-44 · desvincular a un docente", () => {
  it("un docente que no es titular se desvincula con confirmación", async () => {
    const llamadas = simularApi({
      [CURSOS]: lista([cursoConNomina()]),
      "DELETE /cursos/c1/docentes/d2": [
        200,
        {
          id: "v2",
          usuario_id: "d2",
          curso_id: "c1",
          es_titular: false,
          vigente_hasta: "2026-03-02",
        },
      ],
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    fireEvent.click(
      screen.getByRole("button", { name: "Desvincular a «Luis Acosta»" }),
    );
    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "¿Desvincular a Luis Acosta de Primero A?",
    );
    expect(llamadas.some((l) => l.clave.startsWith("DELETE"))).toBe(false);
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar desvinculación" }),
    );

    expect(
      await screen.findByText("Docente desvinculado."),
    ).toBeInTheDocument();
    expect(
      llamadas.find((l) => l.clave === "DELETE /cursos/c1/docentes/d2").cuerpo,
    ).toBeUndefined();
  });

  it("cancelar no pide nada", async () => {
    const llamadas = simularApi({ [CURSOS]: lista([cursoConNomina()]) });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });
    fireEvent.click(
      screen.getByRole("button", { name: "Desvincular a «Luis Acosta»" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(llamadas.some((l) => l.clave.startsWith("DELETE"))).toBe(false);
  });

  it("al titular se lo desvincula designando otro titular en el mismo acto (TC-05)", async () => {
    const llamadas = simularApi({
      [CURSOS]: lista([cursoConNomina()]),
      "DELETE /cursos/c1/docentes/d1": [
        200,
        {
          id: "v1",
          usuario_id: "d1",
          curso_id: "c1",
          es_titular: true,
          vigente_hasta: "2026-03-02",
        },
      ],
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    fireEvent.click(
      screen.getByRole("button", { name: "Desvincular a «Ana Zárate»" }),
    );
    const confirmar = screen.getByRole("button", {
      name: "Confirmar desvinculación",
    });
    expect(confirmar).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Nuevo titular"), {
      target: { value: "d2" },
    });
    expect(confirmar).toBeEnabled();
    fireEvent.click(confirmar);

    expect(
      await screen.findByText("Docente desvinculado."),
    ).toBeInTheDocument();
    expect(
      llamadas.find((l) => l.clave === "DELETE /cursos/c1/docentes/d1").cuerpo,
    ).toEqual({ titular_reemplazo_id: "d2" });
  });

  it("el nuevo titular se elige entre los otros docentes del curso, sin los dados de baja", async () => {
    const baja = persona("d3", "Rosa", "Baja", {
      estado: "dado_de_baja",
      es_titular: false,
    });
    simularApi({
      [CURSOS]: lista([
        cursoConNomina({
          docentes: [
            persona("d1", "Ana", "Zárate", { es_titular: true }),
            persona("d2", "Luis", "Acosta", { es_titular: false }),
            baja,
          ],
        }),
      ]),
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    fireEvent.click(
      screen.getByRole("button", { name: "Desvincular a «Ana Zárate»" }),
    );

    const opciones = within(screen.getByLabelText("Nuevo titular"))
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(opciones).toEqual(["Elegir…", "Luis Acosta"]);
  });

  it("si el titular es el único docente lo dice y no permite confirmar", async () => {
    simularApi({
      [CURSOS]: lista([
        cursoConNomina({
          docentes: [persona("d1", "Ana", "Zárate", { es_titular: true })],
        }),
      ]),
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    fireEvent.click(
      screen.getByRole("button", { name: "Desvincular a «Ana Zárate»" }),
    );

    expect(
      screen.getByText(
        "No hay otro docente en el curso para designar como titular.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirmar desvinculación" }),
    ).toBeDisabled();
  });

  it("un rechazo de la interfaz se presenta con su regla", async () => {
    simularApi({
      [CURSOS]: lista([cursoConNomina()]),
      "DELETE /cursos/c1/docentes/d1": [
        409,
        {
          status: 409,
          detail: "El docente es el titular del curso.",
          regla: "RN-13",
        },
      ],
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });
    fireEvent.click(
      screen.getByRole("button", { name: "Desvincular a «Ana Zárate»" }),
    );
    fireEvent.change(screen.getByLabelText("Nuevo titular"), {
      target: { value: "d2" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar desvinculación" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El docente es el titular del curso. (RN-13)",
    );
  });
});

describe("CP-RF-44 · dar de baja a un docente", () => {
  const desvincular = async () => {
    const llamadas = simularApi({
      [CURSOS]: lista([cursoConNomina()]),
      "DELETE /cursos/c1/docentes/d2": [
        200,
        { id: "v2", usuario_id: "d2", curso_id: "c1", es_titular: false },
      ],
      "DELETE /docentes/d2": [
        200,
        persona("d2", "Luis", "Acosta", { estado: "dado_de_baja" }),
      ],
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });
    fireEvent.click(
      screen.getByRole("button", { name: "Desvincular a «Luis Acosta»" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar desvinculación" }),
    );
    await screen.findByText("Docente desvinculado.");
    return llamadas;
  };

  it("tras desvincularlo se ofrece dar de baja su cuenta, con confirmación", async () => {
    const llamadas = await desvincular();

    expect(
      screen.getByRole("alertdialog", { name: "Confirmar la baja" }),
    ).toHaveTextContent("¿Dar de baja la cuenta de Luis Acosta?");
    expect(llamadas.some((l) => l.clave === "DELETE /docentes/d2")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar baja" }));

    expect(
      await screen.findByText("Docente dado de baja."),
    ).toBeInTheDocument();
    expect(llamadas.some((l) => l.clave === "DELETE /docentes/d2")).toBe(true);
  });

  it("se puede conservar la cuenta", async () => {
    const llamadas = await desvincular();

    fireEvent.click(
      screen.getByRole("button", { name: "Conservar la cuenta" }),
    );

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(llamadas.some((l) => l.clave === "DELETE /docentes/d2")).toBe(false);
  });

  it("si mantiene vinculaciones en otros cursos responde 409 con RN-13 y se presenta", async () => {
    simularApi({
      [CURSOS]: lista([cursoConNomina()]),
      "DELETE /cursos/c1/docentes/d2": [200, {}],
      "DELETE /docentes/d2": [
        409,
        {
          status: 409,
          detail:
            "El docente mantiene vinculaciones vigentes: debe desvincularse antes de cada curso.",
          regla: "RN-13",
        },
      ],
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });
    fireEvent.click(
      screen.getByRole("button", { name: "Desvincular a «Luis Acosta»" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar desvinculación" }),
    );
    await screen.findByText("Docente desvinculado.");

    fireEvent.click(screen.getByRole("button", { name: "Confirmar baja" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("(RN-13)");
  });
});

describe("CP-RF-07 · regenerar el código de activación", () => {
  const pendiente = persona("d4", "Pía", "Pendiente", {
    estado: "pendiente",
    es_titular: false,
  });

  it("sólo se ofrece a los docentes pendientes de activación", async () => {
    simularApi({
      [CURSOS]: lista([
        cursoConNomina({
          docentes: [
            persona("d1", "Ana", "Zárate", { es_titular: true }),
            pendiente,
          ],
        }),
      ]),
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    expect(
      screen.getAllByRole("button", {
        name: /Regenerar el código de activación/,
      }),
    ).toHaveLength(1);
    expect(
      screen.getByRole("button", {
        name: "Regenerar el código de activación de «Pía Pendiente»",
      }),
    ).toBeInTheDocument();
  });

  it("presenta el código nuevo, una sola vez", async () => {
    const llamadas = simularApi({
      [CURSOS]: lista([
        cursoConNomina({
          docentes: [
            persona("d1", "Ana", "Zárate", { es_titular: true }),
            pendiente,
          ],
        }),
      ]),
      "POST /usuarios/d4/codigos-activacion": [
        201,
        codigo({ codigo: "NUEVO-1234", usuario_id: "d4" }),
      ],
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Regenerar el código de activación de «Pía Pendiente»",
      }),
    );

    expect(
      await screen.findByText(
        /Código de activación de Pía Pendiente: NUEVO-1234/,
      ),
    ).toBeInTheDocument();
    expect(
      llamadas.some((l) => l.clave === "POST /usuarios/d4/codigos-activacion"),
    ).toBe(true);
  });

  it("un rechazo de la interfaz se presenta", async () => {
    simularApi({
      [CURSOS]: lista([
        cursoConNomina({
          docentes: [
            persona("d1", "Ana", "Zárate", { es_titular: true }),
            pendiente,
          ],
        }),
      ]),
      "POST /usuarios/d4/codigos-activacion": [
        403,
        { status: 403, detail: "x" },
      ],
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Regenerar el código de activación de «Pía Pendiente»",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El rol de esta cuenta no habilita esta operación.",
    );
  });
});
