// RF-11 Gestión del año lectivo · RF-12 Gestión de cursos · CU-03 · RN-31
// Prueba: CP-RF-11 · CP-RF-12
//
// TC-02 (Tabla 17) · «Crear el año lectivo y los cursos que lo integran». RN-31 · existe un
// solo año lectivo vigente: abrir otro con uno vigente responde 409 con la regla consignada.
// RF-16 (cerrar el año lectivo) es Should have: no se ofrece.
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
import AniosLectivos from "../paneles/directivo/AniosLectivos.jsx";
import Cursos from "../paneles/directivo/Cursos.jsx";
import { panelDe, simularApi } from "./ayudas.js";

const ANIOS = "GET /anios-lectivos?pagina=1&por_pagina=100";
const CURSOS = "GET /cursos?pagina=1&por_pagina=25";
const anio = (n, estado = "vigente") => ({
  id: `an${n}`,
  anio: n,
  estado,
  abierto_en: "2026-02-16T03:00:00Z",
  cerrado_en: null,
});
const curso = (n, extra = {}) => ({
  id: `c${n}`,
  anio_lectivo_id: "an2026",
  nombre: `Curso ${n}`,
  turno: "mañana",
  estado: "vigente",
  alumnos_vinculados: 18,
  ...extra,
});
const coleccion = (datos, extra = {}) => [
  200,
  { datos, total: datos.length, pagina: 1, por_pagina: 25, ...extra },
];

function dibujar(Pantalla, rol = "directivo") {
  const opciones =
    rol === "directivo"
      ? ["anuncios", "anios_lectivos", "cursos"]
      : ["anuncios", "cursos"];
  const valor = {
    panel: panelDe(rol, { opciones_habilitadas: opciones }),
    sesion: {},
    api: crearApi({ obtenerToken: () => "tok" }),
  };
  return render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter>
        <Pantalla />
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
}

const escribir = (etiqueta, valor) =>
  fireEvent.change(screen.getByLabelText(etiqueta), {
    target: { value: valor },
  });

describe("CP-RF-11 · años lectivos", () => {
  it("lista los años con su estado", async () => {
    simularApi({ [ANIOS]: coleccion([anio(2025, "cerrado"), anio(2026)]) });
    dibujar(AniosLectivos);

    const lista = await screen.findByRole("list", { name: "Años lectivos" });
    const filas = within(lista)
      .getAllByRole("listitem")
      .map((li) => li.textContent);
    expect(filas[0]).toContain("2025");
    expect(filas[0]).toContain("Cerrado");
    expect(filas[1]).toContain("2026");
    expect(filas[1]).toContain("Vigente");
  });

  it("sin años lo dice", async () => {
    simularApi({ [ANIOS]: coleccion([]) });
    dibujar(AniosLectivos);

    expect(
      await screen.findByText("Todavía no hay años lectivos."),
    ).toBeInTheDocument();
  });

  it("abre un año lectivo y lo agrega a la lista", async () => {
    const llamadas = simularApi({
      [ANIOS]: coleccion([]),
      "POST /anios-lectivos": [201, anio(2026)],
    });
    dibujar(AniosLectivos);
    await screen.findByText("Todavía no hay años lectivos.");

    escribir("Año", "2026");
    fireEvent.click(screen.getByRole("button", { name: "Abrir año lectivo" }));

    expect(
      await screen.findByText("Año lectivo 2026 abierto."),
    ).toBeInTheDocument();
    expect(
      llamadas.find((l) => l.clave === "POST /anios-lectivos").cuerpo,
    ).toEqual({ anio: 2026 });
    expect(
      within(screen.getByRole("list", { name: "Años lectivos" })).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(1);
  });

  it("con un año vigente, abrir otro responde 409 y se presenta con su regla (RN-31)", async () => {
    simularApi({
      [ANIOS]: coleccion([anio(2026)]),
      "POST /anios-lectivos": [
        409,
        {
          status: 409,
          detail:
            "Ya existe un año lectivo vigente: debe cerrarse antes de abrir otro.",
          regla: "RN-31",
        },
      ],
    });
    dibujar(AniosLectivos);
    await screen.findByRole("list", { name: "Años lectivos" });

    escribir("Año", "2027");
    fireEvent.click(screen.getByRole("button", { name: "Abrir año lectivo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ya existe un año lectivo vigente: debe cerrarse antes de abrir otro. (RN-31)",
    );
  });

  it("un dato inaceptable se presenta", async () => {
    simularApi({
      [ANIOS]: coleccion([]),
      "POST /anios-lectivos": [
        422,
        { status: 422, detail: "Falta el campo obligatorio: anio." },
      ],
    });
    dibujar(AniosLectivos);
    await screen.findByText("Todavía no hay años lectivos.");

    fireEvent.click(screen.getByRole("button", { name: "Abrir año lectivo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Falta el campo obligatorio: anio.",
    );
  });

  it("no ofrece cerrar el año lectivo: RF-16 es Should have", async () => {
    simularApi({ [ANIOS]: coleccion([anio(2026)]) });
    dibujar(AniosLectivos);
    await screen.findByRole("list", { name: "Años lectivos" });

    expect(
      screen.queryByRole("button", { name: /cerrar/i }),
    ).not.toBeInTheDocument();
  });

  it("un error de carga se presenta sin detalle interno", async () => {
    simularApi({ [ANIOS]: [500, { status: 500, detail: "PG::Error" }] });
    dibujar(AniosLectivos);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No fue posible completar la operación.",
    );
  });

  it("mientras llega lo indica", () => {
    global.fetch = jest.fn(() => new Promise(() => {}));
    dibujar(AniosLectivos);

    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });
});

describe("CP-RF-12 · cursos", () => {
  it("lista los cursos con turno, estado y alumnos vinculados", async () => {
    simularApi({
      [ANIOS]: coleccion([anio(2026)]),
      [CURSOS]: coleccion([
        curso(1),
        curso(2, { estado: "archivado", alumnos_vinculados: 0 }),
      ]),
    });
    dibujar(Cursos);

    const lista = await screen.findByRole("list", { name: "Cursos" });
    const filas = within(lista)
      .getAllByRole("listitem")
      .map((li) => li.textContent);
    expect(filas[0]).toContain("Curso 1");
    expect(filas[0]).toContain("18 alumnos vinculados");
    expect(filas[1]).toContain("Archivado");
  });

  it("crea un curso dentro de un año lectivo", async () => {
    const llamadas = simularApi({
      [ANIOS]: coleccion([anio(2026)]),
      [CURSOS]: coleccion([]),
      "POST /cursos": [201, curso(1, { nombre: "Primero A" })],
    });
    dibujar(Cursos);
    await screen.findByText("Todavía no hay cursos.");

    fireEvent.change(await screen.findByLabelText("Año lectivo"), {
      target: { value: "an2026" },
    });
    escribir("Nombre", "Primero A");
    escribir("Turno", "mañana");
    fireEvent.click(screen.getByRole("button", { name: "Crear curso" }));

    expect(
      await screen.findByText("Curso «Primero A» creado."),
    ).toBeInTheDocument();
    expect(llamadas.find((l) => l.clave === "POST /cursos").cuerpo).toEqual({
      anio_lectivo_id: "an2026",
      nombre: "Primero A",
      turno: "mañana",
    });
    expect(
      within(screen.getByRole("list", { name: "Cursos" })).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(1);
  });

  it("un nombre repetido dentro del año responde 409 y se presenta con su regla", async () => {
    simularApi({
      [ANIOS]: coleccion([anio(2026)]),
      [CURSOS]: coleccion([curso(1)]),
      "POST /cursos": [
        409,
        {
          status: 409,
          detail: "Ya existe un curso con ese nombre en el año lectivo.",
          regla: "RN-14",
        },
      ],
    });
    dibujar(Cursos);
    await screen.findByRole("list", { name: "Cursos" });

    fireEvent.change(screen.getByLabelText("Año lectivo"), {
      target: { value: "an2026" },
    });
    escribir("Nombre", "Curso 1");
    escribir("Turno", "tarde");
    fireEvent.click(screen.getByRole("button", { name: "Crear curso" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ya existe un curso con ese nombre en el año lectivo. (RN-14)",
    );
  });

  it("edita el nombre y el turno de un curso", async () => {
    const llamadas = simularApi({
      [ANIOS]: coleccion([anio(2026)]),
      [CURSOS]: coleccion([curso(1)]),
      "PATCH /cursos/c1": [
        200,
        curso(1, { nombre: "Primero Z", turno: "tarde" }),
      ],
    });
    dibujar(Cursos);
    fireEvent.click(
      await screen.findByRole("button", { name: "Editar «Curso 1»" }),
    );

    escribir("Nuevo nombre", "Primero Z");
    escribir("Nuevo turno", "tarde");
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Primero Z")).toBeInTheDocument();
    expect(llamadas.find((l) => l.clave === "PATCH /cursos/c1").cuerpo).toEqual(
      { nombre: "Primero Z", turno: "tarde" },
    );
    expect(screen.queryByLabelText("Nuevo nombre")).not.toBeInTheDocument();
  });

  it("cancelar la edición no pide nada", async () => {
    const llamadas = simularApi({
      [ANIOS]: coleccion([anio(2026)]),
      [CURSOS]: coleccion([curso(1)]),
    });
    dibujar(Cursos);
    fireEvent.click(
      await screen.findByRole("button", { name: "Editar «Curso 1»" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByLabelText("Nuevo nombre")).not.toBeInTheDocument();
    expect(llamadas.some((l) => l.clave.startsWith("PATCH"))).toBe(false);
  });

  it("un rechazo al editar se presenta y se conserva lo escrito", async () => {
    simularApi({
      [ANIOS]: coleccion([anio(2026)]),
      [CURSOS]: coleccion([curso(1)]),
      "PATCH /cursos/c1": [
        409,
        {
          status: 409,
          detail: "Ya existe un curso con ese nombre en el año lectivo.",
          regla: "RN-14",
        },
      ],
    });
    dibujar(Cursos);
    fireEvent.click(
      await screen.findByRole("button", { name: "Editar «Curso 1»" }),
    );
    escribir("Nuevo nombre", "Otro");

    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("(RN-14)");
    expect(screen.getByLabelText("Nuevo nombre")).toHaveValue("Otro");
  });

  it("filtra por año lectivo", async () => {
    const llamadas = simularApi({
      [ANIOS]: coleccion([anio(2025, "cerrado"), anio(2026)]),
      [CURSOS]: coleccion([curso(1)]),
      "GET /cursos?anio_lectivo_id=an2025&pagina=1&por_pagina=25": coleccion([
        curso(9, { anio_lectivo_id: "an2025" }),
      ]),
    });
    dibujar(Cursos);
    await screen.findByText("Curso 1");

    fireEvent.change(screen.getByLabelText("Filtrar por año lectivo"), {
      target: { value: "an2025" },
    });

    expect(await screen.findByText("Curso 9")).toBeInTheDocument();
    expect(
      llamadas.some((l) => l.clave.includes("anio_lectivo_id=an2025")),
    ).toBe(true);
  });

  it("pagina", async () => {
    simularApi({
      [ANIOS]: coleccion([anio(2026)]),
      [CURSOS]: coleccion([curso(1)], { total: 30 }),
      "GET /cursos?pagina=2&por_pagina=25": coleccion([curso(26)], {
        total: 30,
        pagina: 2,
      }),
    });
    dibujar(Cursos);
    await screen.findByText("Curso 1");

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(await screen.findByText("Curso 26")).toBeInTheDocument();
  });

  it("el docente ve sus cursos pero no los controles de administración: la interfaz no se los habilitó", async () => {
    simularApi({ [CURSOS]: coleccion([curso(1)]) });
    dibujar(Cursos, "docente");

    expect(await screen.findByText("Curso 1")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Crear curso" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Editar/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Filtrar por año lectivo"),
    ).not.toBeInTheDocument();
  });

  it("un error de carga se presenta sin detalle interno", async () => {
    simularApi({
      [ANIOS]: coleccion([anio(2026)]),
      [CURSOS]: [500, { status: 500, detail: "PG::Error" }],
    });
    dibujar(Cursos);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No fue posible completar la operación.",
    );
  });

  it("mientras llega lo indica", () => {
    global.fetch = jest.fn(() => new Promise(() => {}));
    dibujar(Cursos);

    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });

  it("mientras crea un curso no admite otro envío", async () => {
    simularApi({ [ANIOS]: coleccion([anio(2026)]), [CURSOS]: coleccion([]) });
    dibujar(Cursos);
    await screen.findByText("Todavía no hay cursos.");
    global.fetch = jest.fn(() => new Promise(() => {}));
    fireEvent.change(screen.getByLabelText("Año lectivo"), {
      target: { value: "an2026" },
    });
    escribir("Nombre", "Primero A");
    escribir("Turno", "mañana");

    fireEvent.click(screen.getByRole("button", { name: "Crear curso" }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Crear curso" }),
      ).toBeDisabled(),
    );
  });
});
