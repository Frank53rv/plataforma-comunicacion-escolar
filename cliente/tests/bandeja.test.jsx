// RF-39 Bandeja de anuncios como vista de entrada · RF-22 · RF-34 · RF-35 · CU-09, CU-10 ·
// RN-15, RN-32
// Prueba: CP-RF-39 · CP-RF-22 · CP-RF-34 · CP-RF-35
//
// RF-39 (Tabla 10) · «El panel de cada rol debe presentar la bandeja de anuncios como vista
// inicial tras la autenticación.» RF-22 · «Todo usuario debe poder recuperar los anuncios
// que le corresponden, filtrando por fecha, curso y remitente.» Fig. 9 · el acuse lo emite
// el cliente al presentar el aviso dentro de la aplicación, y no la respuesta del servicio
// push. RF-35 · las vistas se emiten agrupadas.
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import Bandeja from "../anuncios/Bandeja.jsx";
import { crearApi } from "../comun/api.js";
import { ContextoSesion } from "../comun/contextoSesion.js";
import { panelDe, simularApi } from "./ayudas.js";

const autor = (id, nombre) => ({
  id,
  nombre,
  apellido: "Gómez",
  rol: "docente",
});
const fila = (n, extra = {}) => ({
  id: `a${n}`,
  anuncio_version_id: `v${n}`,
  titulo: `Anuncio ${n}`,
  publicado_en: "2026-03-02T15:30:00Z",
  autor: autor("d1", "Ana"),
  leido: false,
  ...extra,
});
const pagina = (datos, extra = {}) => [
  200,
  { datos, total: datos.length, pagina: 1, por_pagina: 25, ...extra },
];

const cursos = [
  { id: "c1", nombre: "Primero A" },
  { id: "c2", nombre: "Primero B" },
];

function dibujar(rol = "tutor", extraPanel = {}) {
  const valor = {
    panel: panelDe(rol, { cursos, ...extraPanel }),
    api: crearApi({ obtenerToken: () => "tok" }),
  };
  return render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Bandeja />} />
          <Route path="/anuncios/:id" element={<p>detalle</p>} />
        </Routes>
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
}

const consulta = (llamadas) =>
  Object.fromEntries(
    new URLSearchParams(
      llamadas
        .find((l) => l.clave.startsWith("GET /anuncios?"))
        .clave.split("?")[1],
    ),
  );
const ultimaConsulta = (llamadas) => {
  const gets = llamadas.filter((l) => l.clave.startsWith("GET /anuncios?"));
  return Object.fromEntries(
    new URLSearchParams(gets[gets.length - 1].clave.split("?")[1]),
  );
};

class ObservadorFalso {
  constructor(alEntrar) {
    this.alEntrar = alEntrar;
    this.nodos = [];
    ObservadorFalso.ultimo = this;
  }
  observe(nodo) {
    this.nodos.push(nodo);
  }
  disconnect() {}
  entrar(...nodos) {
    this.alEntrar(nodos.map((target) => ({ isIntersecting: true, target })));
  }
}

beforeEach(() => {
  delete global.IntersectionObserver;
  ObservadorFalso.ultimo = undefined;
});

describe("CP-RF-39 · la bandeja como vista de entrada", () => {
  it("presenta cada anuncio con su título, su autor y la fecha en hora de Asunción", async () => {
    simularApi({ "GET /anuncios?pagina=1&por_pagina=25": pagina([fila(1)]) });
    dibujar();

    const enlace = await screen.findByRole("link", { name: "Anuncio 1" });
    expect(enlace).toHaveAttribute("href", "/anuncios/a1");
    const lista = within(screen.getByRole("list"));
    expect(lista.getByText("Ana Gómez")).toBeInTheDocument();
    expect(lista.getByText("02/03/2026 12:30")).toBeInTheDocument();
  });

  it("los destinatarios ven qué anuncios todavía no leyeron", async () => {
    simularApi({
      "GET /anuncios?pagina=1&por_pagina=25": pagina([
        fila(1),
        fila(2, { leido: true }),
      ]),
    });
    dibujar("tutor");

    await screen.findByRole("link", { name: "Anuncio 1" });
    expect(screen.getAllByText("Sin leer")).toHaveLength(1);
  });

  it("quienes no son destinatarios —docente, directivo— no ven la marca: no tienen entrega", async () => {
    simularApi({ "GET /anuncios?pagina=1&por_pagina=25": pagina([fila(1)]) });
    dibujar("docente");

    await screen.findByRole("link", { name: "Anuncio 1" });
    expect(screen.queryByText("Sin leer")).not.toBeInTheDocument();
  });

  it("sin anuncios lo dice", async () => {
    simularApi({ "GET /anuncios?pagina=1&por_pagina=25": pagina([]) });
    dibujar();

    expect(
      await screen.findByText("No hay anuncios para los filtros elegidos."),
    ).toBeInTheDocument();
  });

  it("un error de la interfaz se presenta sin detalle interno", async () => {
    simularApi({
      "GET /anuncios?pagina=1&por_pagina=25": [
        500,
        { status: 500, detail: "PG::Error interno" },
      ],
    });
    dibujar();

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("No fue posible completar la operación.");
    expect(alerta).not.toHaveTextContent("PG::Error");
  });

  it("mientras llega la primera página lo indica", () => {
    global.fetch = jest.fn(() => new Promise(() => {}));
    dibujar();

    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });
});

describe("CP-RF-22 · filtros del historial", () => {
  it("filtra por curso, con los cursos que el panel de la persona declaró", async () => {
    const llamadas = simularApi({
      "GET /anuncios?pagina=1&por_pagina=25": pagina([fila(1)]),
      "GET /anuncios?curso_id=c2&pagina=1&por_pagina=25": pagina([fila(2)]),
    });
    dibujar();
    await screen.findByRole("link", { name: "Anuncio 1" });

    fireEvent.change(screen.getByLabelText("Curso"), {
      target: { value: "c2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Filtrar" }));

    expect(
      await screen.findByRole("link", { name: "Anuncio 2" }),
    ).toBeInTheDocument();
    expect(ultimaConsulta(llamadas)).toMatchObject({
      curso_id: "c2",
      pagina: "1",
    });
  });

  it("filtra por fecha: el día elegido es el de Asunción, de su primer al último instante", async () => {
    const llamadas = simularApi({});
    global.fetch.mockImplementation(async (url) => {
      llamadas.push({ clave: `GET ${url.replace("/api/v1", "")}` });
      return {
        ok: true,
        status: 200,
        json: async () => ({ datos: [], total: 0, pagina: 1, por_pagina: 25 }),
      };
    });
    dibujar();
    await screen.findByText("No hay anuncios para los filtros elegidos.");

    fireEvent.change(screen.getByLabelText("Desde"), {
      target: { value: "2026-03-02" },
    });
    fireEvent.change(screen.getByLabelText("Hasta"), {
      target: { value: "2026-03-04" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Filtrar" }));

    await waitFor(() =>
      expect(ultimaConsulta(llamadas)).toMatchObject({
        desde: "2026-03-02T03:00:00.000Z",
      }),
    );
    expect(ultimaConsulta(llamadas).hasta).toBe("2026-03-05T02:59:59.999Z");
  });

  it("filtra por remitente, con los autores que el historial ya devolvió", async () => {
    const llamadas = simularApi({
      "GET /anuncios?pagina=1&por_pagina=25": pagina([
        fila(1),
        fila(2, { autor: autor("d2", "Luis") }),
      ]),
      "GET /anuncios?remitente_id=d2&pagina=1&por_pagina=25": pagina([
        fila(2, { autor: autor("d2", "Luis") }),
      ]),
    });
    dibujar();
    await screen.findByRole("link", { name: "Anuncio 1" });

    const opciones = within(screen.getByLabelText("Remitente")).getAllByRole(
      "option",
    );
    expect(opciones.map((o) => o.textContent)).toEqual([
      "Todos",
      "Ana Gómez",
      "Luis Gómez",
    ]);
    fireEvent.change(screen.getByLabelText("Remitente"), {
      target: { value: "d2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Filtrar" }));

    await waitFor(() =>
      expect(ultimaConsulta(llamadas)).toMatchObject({ remitente_id: "d2" }),
    );
    // Filtrar no pierde las demás opciones: siguen elegibles.
    expect(
      within(screen.getByLabelText("Remitente")).getAllByRole("option"),
    ).toHaveLength(3);
  });

  it("limpiar vuelve a pedir el historial completo", async () => {
    const llamadas = simularApi({
      "GET /anuncios?pagina=1&por_pagina=25": pagina([fila(1)]),
      "GET /anuncios?curso_id=c1&pagina=1&por_pagina=25": pagina([]),
    });
    dibujar();
    await screen.findByRole("link", { name: "Anuncio 1" });
    fireEvent.change(screen.getByLabelText("Curso"), {
      target: { value: "c1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Filtrar" }));
    await screen.findByText("No hay anuncios para los filtros elegidos.");

    fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));

    expect(
      await screen.findByRole("link", { name: "Anuncio 1" }),
    ).toBeInTheDocument();
    expect(consulta(llamadas)).toEqual({ pagina: "1", por_pagina: "25" });
  });

  it("pagina el historial de a 25 y vuelve a la primera página al cambiar el filtro", async () => {
    const llamadas = simularApi({
      "GET /anuncios?pagina=1&por_pagina=25": pagina([fila(1)], { total: 60 }),
      "GET /anuncios?pagina=2&por_pagina=25": pagina([fila(26)], {
        total: 60,
        pagina: 2,
      }),
      "GET /anuncios?curso_id=c1&pagina=1&por_pagina=25": pagina([fila(3)], {
        total: 5,
      }),
    });
    dibujar();
    await screen.findByRole("link", { name: "Anuncio 1" });
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(
      await screen.findByRole("link", { name: "Anuncio 26" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Curso"), {
      target: { value: "c1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Filtrar" }));
    await screen.findByRole("link", { name: "Anuncio 3" });
    expect(ultimaConsulta(llamadas)).toMatchObject({
      curso_id: "c1",
      pagina: "1",
    });
    expect(screen.queryByText(/Página/)).not.toBeInTheDocument();
  });

  it("volver a la página anterior", async () => {
    simularApi({
      "GET /anuncios?pagina=1&por_pagina=25": pagina([fila(1)], { total: 60 }),
      "GET /anuncios?pagina=2&por_pagina=25": pagina([fila(26)], {
        total: 60,
        pagina: 2,
      }),
    });
    dibujar();
    await screen.findByRole("link", { name: "Anuncio 1" });
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await screen.findByRole("link", { name: "Anuncio 26" });

    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));

    expect(
      await screen.findByRole("link", { name: "Anuncio 1" }),
    ).toBeInTheDocument();
  });
});

describe("CP-RF-34 · acuse al presentar el aviso dentro de la aplicación (Fig. 9)", () => {
  it("emite el acuse de los anuncios que todavía no leyó, en una sola petición", async () => {
    const llamadas = simularApi({
      "GET /anuncios?pagina=1&por_pagina=25": pagina([
        fila(1),
        fila(2, { leido: true }),
        fila(3),
      ]),
      "POST /entregas/acuses": [
        200,
        { registrada: 2, omitida_por_idempotencia: 0 },
      ],
    });
    dibujar("alumno");

    await waitFor(() =>
      expect(llamadas.some((l) => l.clave === "POST /entregas/acuses")).toBe(
        true,
      ),
    );
    expect(
      llamadas.filter((l) => l.clave === "POST /entregas/acuses"),
    ).toHaveLength(1);
    expect(
      llamadas.find((l) => l.clave === "POST /entregas/acuses").cuerpo,
    ).toEqual({
      anuncio_version_ids: ["v1", "v3"],
    });
  });

  it("si ya leyó todos, no emite nada", async () => {
    const llamadas = simularApi({
      "GET /anuncios?pagina=1&por_pagina=25": pagina([
        fila(1, { leido: true }),
      ]),
    });
    dibujar("tutor");
    await screen.findByRole("link", { name: "Anuncio 1" });

    expect(llamadas.some((l) => l.clave === "POST /entregas/acuses")).toBe(
      false,
    );
  });

  it("el docente y el directivo no son destinatarios: no emiten acuses ni vistas", async () => {
    const llamadas = simularApi({
      "GET /anuncios?pagina=1&por_pagina=25": pagina([fila(1)]),
    });
    dibujar("docente");
    await screen.findByRole("link", { name: "Anuncio 1" });

    expect(
      llamadas.map((l) => l.clave).filter((c) => c.startsWith("POST")),
    ).toEqual([]);
  });

  it("un fallo al emitir el acuse no impide consultar la bandeja", async () => {
    simularApi({
      "GET /anuncios?pagina=1&por_pagina=25": pagina([fila(1)]),
      "POST /entregas/acuses": [500, { status: 500, detail: "x" }],
    });
    dibujar("tutor");

    expect(
      await screen.findByRole("link", { name: "Anuncio 1" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("CP-RF-35 · vistas agrupadas de lo que entra al área visible", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.IntersectionObserver = ObservadorFalso;
  });
  afterEach(() => jest.useRealTimers());

  it("emite en una sola petición los anuncios que entraron, con su identificador de publicación", async () => {
    const llamadas = simularApi({
      "GET /anuncios?pagina=1&por_pagina=25": pagina([
        fila(1),
        fila(2),
        fila(3),
      ]),
      "POST /entregas/acuses": [200, {}],
      "POST /entregas/vistas": [
        200,
        { registrada: 2, omitida_por_idempotencia: 0 },
      ],
    });
    dibujar("tutor");
    await screen.findByRole("link", { name: "Anuncio 1" });

    const [primero, segundo] = ObservadorFalso.ultimo.nodos;
    await act(async () => {
      ObservadorFalso.ultimo.entrar(primero, segundo);
      jest.advanceTimersByTime(2000);
    });

    const vistas = llamadas.filter((l) => l.clave === "POST /entregas/vistas");
    expect(vistas).toHaveLength(1);
    expect(vistas[0].cuerpo.anuncio_version_ids.sort()).toEqual(["v1", "v2"]);
  });

  it("no observa nada para quien no es destinatario", async () => {
    simularApi({ "GET /anuncios?pagina=1&por_pagina=25": pagina([fila(1)]) });
    dibujar("directivo");
    await screen.findByRole("link", { name: "Anuncio 1" });

    expect(ObservadorFalso.ultimo?.nodos ?? []).toEqual([]);
  });
});
