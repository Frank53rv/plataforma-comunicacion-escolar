// RF-04 Alta de alumnos y tutores · RF-05 · RF-07 · RF-09 Baja de alumnos · RF-10 Baja de tutores
// · RF-13 Vinculación de alumnos a cursos · RF-14 Vinculación de tutores · CU-05 · RN-06, RN-11,
// RN-12
// Prueba: CP-RF-04 · CP-RF-05 · CP-RF-07 · CP-RF-09 · CP-RF-10 · CP-RF-13 · CP-RF-14
//
// TC-09 y TC-10 (Tabla 17) · dar de alta a un alumno, vincularlo al curso y registrar sus
// tutores; dar de baja a un alumno y a un tutor de su curso. Las altas son del docente; las bajas,
// del directivo y del docente titular (Tabla 18). RN-12 · un tutor con algún alumno activo no
// se da de baja. RNF-14 · las bajas piden confirmación. El código de activación se presenta una
// sola vez (RN-06).
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
import Alumnos from "../paneles/comun/Alumnos.jsx";
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

const OPCIONES = {
  directivo: ["anuncios", "anios_lectivos", "cursos", "docentes", "alumnos"],
  docente: ["anuncios", "cursos", "alumnos", "altas_de_alumnos_y_tutores"],
};

function dibujar(rol = "docente", usuarioId = "d1") {
  const valor = {
    panel: panelDe(rol, {
      opciones_habilitadas: OPCIONES[rol],
      cursos: [{ id: "c1", nombre: "Primero A" }],
    }),
    sesion: { usuario_id: usuarioId },
    api: crearApi({ obtenerToken: () => "tok" }),
  };
  return render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter>
        <Alumnos />
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
}

const escribir = (etiqueta, valor) =>
  fireEvent.change(screen.getByLabelText(etiqueta), {
    target: { value: valor },
  });

describe("CP-RF-13 · alumnos y tutores por curso", () => {
  it("lista los alumnos de cada curso con sus tutores", async () => {
    simularApi({ [CURSOS]: lista([cursoConNomina()]) });
    dibujar();

    const seccion = await screen.findByRole("region", { name: "Primero A" });
    expect(within(seccion).getByText("Beto Ramos")).toBeInTheDocument();
    expect(within(seccion).getByText("Marta Ramos")).toBeInTheDocument();
  });

  it("un curso sin alumnos lo dice", async () => {
    simularApi({ [CURSOS]: lista([cursoConNomina({ alumnos: [] })]) });
    dibujar();

    expect(
      await screen.findByText("Sin alumnos vinculados."),
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

  it("marca a los pendientes de activación y a los dados de baja, y a éstos les quita las acciones", async () => {
    const curso = cursoConNomina({
      alumnos: [
        {
          ...persona("al2", "Pía", "Pendiente", { estado: "pendiente" }),
          tutores: [],
        },
        {
          ...persona("al3", "Rosa", "Baja", { estado: "dado_de_baja" }),
          tutores: [],
        },
      ],
    });
    simularApi({ [CURSOS]: lista([curso]) });
    dibujar("directivo", "dir");

    await screen.findByRole("region", { name: "Primero A" });
    expect(screen.getByText("Pendiente de activación")).toBeInTheDocument();
    expect(screen.getByText("Dado de baja")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /«Rosa Baja»/ }),
    ).not.toBeInTheDocument();
  });
});

describe("CP-RF-04 · alta de un alumno (docente)", () => {
  it("lo da de alta en el curso y presenta su código de activación, una sola vez", async () => {
    const llamadas = simularApi({
      [CURSOS]: lista([cursoConNomina()]),
      "POST /alumnos": [
        201,
        {
          usuario: persona("al9", "Nico", "Nuevo", { estado: "pendiente" }),
          alumno_curso: { id: "v", curso_id: "c1" },
          codigo_activacion: codigo(),
        },
      ],
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    escribir("Nombre", "Nico");
    escribir("Apellido", "Nuevo");
    escribir("Correo", "nico@ejemplo.test");
    fireEvent.change(screen.getByLabelText("Curso"), {
      target: { value: "c1" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Dar de alta al alumno" }),
    );

    expect(
      await screen.findByText(/Código de activación de Nico Nuevo: ABCD-EFGH/),
    ).toBeInTheDocument();
    expect(llamadas.find((l) => l.clave === "POST /alumnos").cuerpo).toEqual({
      nombre: "Nico",
      apellido: "Nuevo",
      correo: "nico@ejemplo.test",
      curso_id: "c1",
    });
    fireEvent.click(screen.getByRole("button", { name: "Entendido" }));
    expect(
      screen.queryByText(/Código de activación de Nico/),
    ).not.toBeInTheDocument();
  });

  it("sin elegir curso no pide nada", async () => {
    const llamadas = simularApi({ [CURSOS]: lista([cursoConNomina()]) });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });
    escribir("Nombre", "N");
    escribir("Apellido", "A");
    escribir("Correo", "n@ejemplo.test");

    fireEvent.click(
      screen.getByRole("button", { name: "Dar de alta al alumno" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Elegir el curso del alumno.",
    );
    expect(llamadas.some((l) => l.clave.startsWith("POST"))).toBe(false);
  });

  it("un rechazo de la interfaz —correo ya registrado, alumno ya vinculado— se presenta", async () => {
    simularApi({
      [CURSOS]: lista([cursoConNomina()]),
      "POST /alumnos": [
        409,
        {
          status: 409,
          detail: "El alumno ya pertenece a un curso vigente.",
          regla: "RN-14",
        },
      ],
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });
    escribir("Nombre", "N");
    escribir("Apellido", "A");
    escribir("Correo", "n@ejemplo.test");
    fireEvent.change(screen.getByLabelText("Curso"), {
      target: { value: "c1" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Dar de alta al alumno" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El alumno ya pertenece a un curso vigente. (RN-14)",
    );
  });

  it("el directivo no da de alta alumnos: la interfaz no se lo habilitó", async () => {
    simularApi({ [CURSOS]: lista([cursoConNomina()]) });
    dibujar("directivo", "dir");
    await screen.findByRole("region", { name: "Primero A" });

    expect(
      screen.queryByRole("button", { name: "Dar de alta al alumno" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Agregar tutor/ }),
    ).not.toBeInTheDocument();
  });
});

describe("CP-RF-14 · un alumno recién dado de alta admite tutores antes de activar su cuenta", () => {
  it("un alumno pendiente de activación ofrece «Agregar tutor»", async () => {
    const curso = cursoConNomina({
      alumnos: [
        {
          ...persona("al2", "Pía", "Pendiente", { estado: "pendiente" }),
          tutores: [],
        },
      ],
    });
    simularApi({ [CURSOS]: lista([curso]) });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    expect(
      screen.getByRole("button", {
        name: "Agregar un tutor a «Pía Pendiente»",
      }),
    ).toBeInTheDocument();
  });

  it("un alumno dado de baja no", async () => {
    const curso = cursoConNomina({
      alumnos: [
        {
          ...persona("al3", "Rosa", "Baja", { estado: "dado_de_baja" }),
          tutores: [],
        },
      ],
    });
    simularApi({ [CURSOS]: lista([curso]) });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    expect(
      screen.queryByRole("button", { name: /Agregar un tutor/ }),
    ).not.toBeInTheDocument();
  });
});

describe("CP-RF-14 · agregar un tutor a un alumno (docente)", () => {
  const abrirFormulario = async (extra = {}) => {
    const llamadas = simularApi({
      [CURSOS]: lista([cursoConNomina()]),
      ...extra,
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });
    fireEvent.click(
      screen.getByRole("button", { name: "Agregar un tutor a «Beto Ramos»" }),
    );
    escribir("Nombre del tutor", "Tomás");
    escribir("Apellido del tutor", "Nuevo");
    escribir("Correo del tutor", "tomas@ejemplo.test");
    return llamadas;
  };

  it("lo vincula y presenta su código de activación", async () => {
    const llamadas = await abrirFormulario({
      "POST /alumnos/al1/tutores": [
        201,
        {
          usuario: persona("t9", "Tomás", "Nuevo", { estado: "pendiente" }),
          tutor_alumno: {},
          codigo_activacion: codigo({ codigo: "TUTOR-999" }),
        },
      ],
    });

    fireEvent.click(screen.getByRole("button", { name: "Vincular tutor" }));

    expect(
      await screen.findByText(/Código de activación de Tomás Nuevo: TUTOR-999/),
    ).toBeInTheDocument();
    expect(
      llamadas.find((l) => l.clave === "POST /alumnos/al1/tutores").cuerpo,
    ).toEqual({
      nombre: "Tomás",
      apellido: "Nuevo",
      correo: "tomas@ejemplo.test",
    });
    expect(screen.queryByLabelText("Nombre del tutor")).not.toBeInTheDocument();
  });

  it("un tutor que ya tenía cuenta queda vinculado sin código nuevo", async () => {
    await abrirFormulario({
      "POST /alumnos/al1/tutores": [
        201,
        {
          usuario: persona("t1", "Marta", "Ramos"),
          tutor_alumno: {},
          codigo_activacion: null,
        },
      ],
    });

    fireEvent.click(screen.getByRole("button", { name: "Vincular tutor" }));

    expect(
      await screen.findByText(
        "El tutor ya tenía cuenta: quedó vinculado, sin código nuevo.",
      ),
    ).toBeInTheDocument();
  });

  it("el límite de tutores por alumno lo informa la interfaz y se presenta", async () => {
    await abrirFormulario({
      "POST /alumnos/al1/tutores": [
        422,
        { status: 422, detail: "El alumno ya tiene el máximo de tutores." },
      ],
    });

    fireEvent.click(screen.getByRole("button", { name: "Vincular tutor" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El alumno ya tiene el máximo de tutores.",
    );
  });

  it("cancelar cierra el formulario sin pedir nada", async () => {
    const llamadas = await abrirFormulario();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByLabelText("Nombre del tutor")).not.toBeInTheDocument();
    expect(llamadas.some((l) => l.clave.startsWith("POST"))).toBe(false);
  });
});

describe("CP-RF-09 · dar de baja a un alumno", () => {
  it("el directivo lo da de baja, con confirmación", async () => {
    const llamadas = simularApi({
      [CURSOS]: lista([cursoConNomina()]),
      "DELETE /alumnos/al1": [
        200,
        persona("al1", "Beto", "Ramos", { estado: "dado_de_baja" }),
      ],
    });
    dibujar("directivo", "dir");
    await screen.findByRole("region", { name: "Primero A" });

    fireEvent.click(
      screen.getByRole("button", { name: "Dar de baja a «Beto Ramos»" }),
    );
    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "¿Dar de baja a Beto Ramos?",
    );
    expect(llamadas.some((l) => l.clave.startsWith("DELETE"))).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar baja" }));

    expect(await screen.findByText("Alumno dado de baja.")).toBeInTheDocument();
  });

  it("el docente titular del curso la ve; el que no es titular, no", async () => {
    const titular = cursoConNomina();
    simularApi({ [CURSOS]: lista([titular]) });
    const { unmount } = dibujar("docente", "d1");
    await screen.findByRole("region", { name: "Primero A" });
    expect(
      screen.getByRole("button", { name: "Dar de baja a «Beto Ramos»" }),
    ).toBeInTheDocument();
    unmount();

    simularApi({ [CURSOS]: lista([titular]) });
    dibujar("docente", "d2");
    await screen.findByRole("region", { name: "Primero A" });
    expect(
      screen.queryByRole("button", { name: "Dar de baja a «Beto Ramos»" }),
    ).not.toBeInTheDocument();
  });

  it("cancelar no pide nada", async () => {
    const llamadas = simularApi({ [CURSOS]: lista([cursoConNomina()]) });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });
    fireEvent.click(
      screen.getByRole("button", { name: "Dar de baja a «Beto Ramos»" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(llamadas.some((l) => l.clave.startsWith("DELETE"))).toBe(false);
  });

  it("un rechazo de la interfaz se presenta", async () => {
    simularApi({
      [CURSOS]: lista([cursoConNomina()]),
      "DELETE /alumnos/al1": [403, { status: 403, detail: "x" }],
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });
    fireEvent.click(
      screen.getByRole("button", { name: "Dar de baja a «Beto Ramos»" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirmar baja" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El rol de esta cuenta no habilita esta operación.",
    );
  });
});

describe("CP-RF-10 · dar de baja a un tutor", () => {
  it("lo da de baja, con confirmación", async () => {
    const llamadas = simularApi({
      [CURSOS]: lista([cursoConNomina()]),
      "DELETE /tutores/t1": [
        200,
        persona("t1", "Marta", "Ramos", { estado: "dado_de_baja" }),
      ],
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    fireEvent.click(
      screen.getByRole("button", { name: "Dar de baja a «Marta Ramos»" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirmar baja" }));

    expect(await screen.findByText("Tutor dado de baja.")).toBeInTheDocument();
    expect(llamadas.some((l) => l.clave === "DELETE /tutores/t1")).toBe(true);
  });

  it("un tutor con algún alumno activo responde 409 con RN-12 y se presenta", async () => {
    simularApi({
      [CURSOS]: lista([cursoConNomina()]),
      "DELETE /tutores/t1": [
        409,
        {
          status: 409,
          detail: "El tutor mantiene al menos un alumno activo en un curso.",
          regla: "RN-12",
        },
      ],
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });
    fireEvent.click(
      screen.getByRole("button", { name: "Dar de baja a «Marta Ramos»" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirmar baja" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El tutor mantiene al menos un alumno activo en un curso. (RN-12)",
    );
  });
});

describe("CP-RF-07 · regenerar el código de activación de un alumno o un tutor (docente)", () => {
  const curso = () =>
    cursoConNomina({
      alumnos: [
        {
          ...persona("al2", "Pía", "Pendiente", { estado: "pendiente" }),
          tutores: [
            persona("t2", "Tito", "Pendiente", { estado: "pendiente" }),
          ],
        },
      ],
    });

  it("se ofrece sólo a los pendientes", async () => {
    simularApi({ [CURSOS]: lista([cursoConNomina()]) });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    expect(
      screen.queryByRole("button", { name: /Regenerar/ }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["al2", "Pía Pendiente"],
    ["t2", "Tito Pendiente"],
  ])("presenta el código nuevo de %s", async (id, nombre) => {
    simularApi({
      [CURSOS]: lista([curso()]),
      [`POST /usuarios/${id}/codigos-activacion`]: [
        201,
        codigo({ codigo: "NUEVO-777" }),
      ],
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    fireEvent.click(
      screen.getByRole("button", {
        name: `Regenerar el código de activación de «${nombre}»`,
      }),
    );

    expect(
      await screen.findByText(
        new RegExp(`Código de activación de ${nombre}: NUEVO-777`),
      ),
    ).toBeInTheDocument();
  });

  it("el directivo no lo regenera para alumnos ni tutores: la interfaz no se lo habilitó", async () => {
    simularApi({ [CURSOS]: lista([curso()]) });
    dibujar("directivo", "dir");
    await screen.findByRole("region", { name: "Primero A" });

    expect(
      screen.queryByRole("button", { name: /Regenerar/ }),
    ).not.toBeInTheDocument();
  });

  it("recarga la nómina tras las altas y las bajas", async () => {
    const llamadas = simularApi({
      [CURSOS]: lista([cursoConNomina()]),
      "DELETE /tutores/t1": [200, {}],
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });
    fireEvent.click(
      screen.getByRole("button", { name: "Dar de baja a «Marta Ramos»" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirmar baja" }));

    await waitFor(() =>
      expect(llamadas.filter((l) => l.clave === CURSOS).length).toBeGreaterThan(
        1,
      ),
    );
  });
});
