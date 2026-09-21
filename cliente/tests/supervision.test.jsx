// RF-45 Consulta directiva del estado de la comunicación · CU-15, CU-09 · RN-15
// Prueba: CP-RF-45
//
// TC-06 (Tabla 17) · «Consultar el estado agregado de entrega y lectura por curso».
// RF-45 (Tabla 10) · «El directivo debe poder consultar los anuncios de la totalidad de los
// cursos del año lectivo vigente y el estado agregado de entrega y lectura por curso.» La
// supervisión de conversaciones (RF-46) es Should have: no se ofrece.
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
import Supervision from "../paneles/directivo/Supervision.jsx";
import { panelDe, simularApi } from "./ayudas.js";

const ANIOS = "GET /anios-lectivos?pagina=1&por_pagina=100";
const SUPERVISION = "GET /supervision/cursos";
const anio = (n, estado = "vigente") => ({
  id: `an${n}`,
  anio: n,
  estado,
  abierto_en: "2026-02-16T03:00:00Z",
  cerrado_en: null,
});
const fila = (nombre, extra = {}) => ({
  curso: {
    id: `c-${nombre}`,
    nombre,
    turno: "mañana",
    estado: "vigente",
    alumnos_vinculados: 18,
  },
  anuncios: 20,
  enviadas: 1800,
  entregadas: 1700,
  vistas: 1500,
  leidas: 1200,
  ...extra,
});
const coleccion = (datos) => [
  200,
  { datos, total: datos.length, pagina: 1, por_pagina: 25 },
];

function dibujar() {
  const valor = {
    panel: panelDe("directivo", {
      opciones_habilitadas: ["anuncios", "supervision", "anios_lectivos"],
    }),
    sesion: { usuario_id: "dir" },
    api: crearApi({ obtenerToken: () => "tok" }),
  };
  return render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter>
        <Supervision />
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
}

describe("CP-RF-45 · estado de la comunicación por curso", () => {
  it("presenta, por curso, la cantidad de anuncios y de entregas enviadas, entregadas, vistas y leídas", async () => {
    simularApi({
      [ANIOS]: coleccion([anio(2026)]),
      [SUPERVISION]: coleccion([
        fila("Primero A"),
        fila("Primero B", {
          anuncios: 5,
          enviadas: 400,
          entregadas: 380,
          vistas: 300,
          leidas: 250,
        }),
      ]),
    });
    dibujar();

    const primero = await screen.findByRole("region", { name: "Primero A" });
    const valores = Object.fromEntries(
      within(primero)
        .getAllByRole("term")
        .map((t) => [t.textContent, t.nextElementSibling.textContent]),
    );
    expect(valores).toEqual({
      Anuncios: "20",
      Enviadas: "1800",
      Entregadas: "1700",
      Vistas: "1500",
      Leídas: "1200",
    });
    const segundo = screen.getByRole("region", { name: "Primero B" });
    expect(within(segundo).getByText("250")).toBeInTheDocument();
  });

  it("por omisión pide el año lectivo vigente, sin decidirlo el cliente", async () => {
    const llamadas = simularApi({
      [ANIOS]: coleccion([anio(2026)]),
      [SUPERVISION]: coleccion([fila("Primero A")]),
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    expect(
      llamadas
        .filter((l) => l.clave.startsWith("GET /supervision"))
        .map((l) => l.clave),
    ).toEqual([SUPERVISION]);
  });

  it("permite consultar otro año lectivo", async () => {
    const llamadas = simularApi({
      [ANIOS]: coleccion([anio(2025, "cerrado"), anio(2026)]),
      [SUPERVISION]: coleccion([fila("Primero A")]),
      "GET /supervision/cursos?anio_lectivo_id=an2025": coleccion([
        fila("Antiguo", { anuncios: 3 }),
      ]),
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    fireEvent.change(await screen.findByLabelText("Año lectivo"), {
      target: { value: "an2025" },
    });

    expect(
      await screen.findByRole("region", { name: "Antiguo" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Primero A" }),
    ).not.toBeInTheDocument();
    expect(
      llamadas.some(
        (l) => l.clave === "GET /supervision/cursos?anio_lectivo_id=an2025",
      ),
    ).toBe(true);
  });

  it("las opciones del año son los años lectivos, y la opción por omisión es el año vigente", async () => {
    simularApi({
      [ANIOS]: coleccion([anio(2025, "cerrado"), anio(2026)]),
      [SUPERVISION]: coleccion([]),
    });
    dibujar();

    const selector = await screen.findByLabelText("Año lectivo");
    await waitFor(() =>
      expect(within(selector).getAllByRole("option")).toHaveLength(3),
    );
    expect(
      within(selector)
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual(["Año vigente", "2025", "2026"]);
    expect(selector).toHaveValue("");
  });

  it("sin cursos en el año lo dice", async () => {
    simularApi({
      [ANIOS]: coleccion([anio(2026)]),
      [SUPERVISION]: coleccion([]),
    });
    dibujar();

    expect(
      await screen.findByText("No hay cursos en el año lectivo elegido."),
    ).toBeInTheDocument();
  });

  it("no presenta porcentajes ni umbrales: son los conteos que la interfaz consigna", async () => {
    simularApi({
      [ANIOS]: coleccion([anio(2026)]),
      [SUPERVISION]: coleccion([fila("Primero A")]),
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("no ofrece supervisar conversaciones: RF-46 es Should have", async () => {
    simularApi({
      [ANIOS]: coleccion([anio(2026)]),
      [SUPERVISION]: coleccion([fila("Primero A")]),
    });
    dibujar();
    await screen.findByRole("region", { name: "Primero A" });

    expect(screen.queryByText(/conversaci/i)).not.toBeInTheDocument();
  });

  it("un rechazo o un error se presenta sin detalle interno", async () => {
    simularApi({
      [ANIOS]: coleccion([anio(2026)]),
      [SUPERVISION]: [403, { status: 403, detail: "x" }],
    });
    dibujar();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El rol de esta cuenta no habilita esta operación.",
    );
  });

  it("si no pudo cargar los años lectivos sigue mostrando el vigente", async () => {
    simularApi({
      [ANIOS]: [500, { status: 500, detail: "PG::Error" }],
      [SUPERVISION]: coleccion([fila("Primero A")]),
    });
    dibujar();

    expect(
      await screen.findByRole("region", { name: "Primero A" }),
    ).toBeInTheDocument();
  });

  it("mientras llega lo indica", () => {
    global.fetch = jest.fn(() => new Promise(() => {}));
    dibujar();

    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });
});
