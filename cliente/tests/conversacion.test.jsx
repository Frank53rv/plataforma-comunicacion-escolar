// RF-25 Canal grupal del curso · RF-28 Persistencia e historial de mensajes · RF-29 ·
// CU-12 · RN-23, RN-27
// Prueba: CP-RF-25 · CP-RF-28 · CP-RF-29
//
// TC-14 y TC-19 (Tabla 17) · enviar un mensaje en el canal grupal del curso, el docente y el
// tutor. Figura 8 · el mensaje se persiste, se difunde a los conectados y llega en vivo. La
// pertenencia al canal la decide la interfaz de programación (RN-23, RF-29): el cliente
// presenta lo que recibe.
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createConsumer } from "@rails/actioncable";
import { MemoryRouter, Route, Routes } from "react-router";
import Conversacion from "../conversacion/Conversacion.jsx";
import Conversaciones from "../conversacion/Conversaciones.jsx";
import { crearApi } from "../comun/api.js";
import { ContextoSesion } from "../comun/contextoSesion.js";
import { panelDe, simularApi } from "./ayudas.js";

jest.mock("@rails/actioncable", () => ({ createConsumer: jest.fn() }));

const cursos = [{ id: "c1", nombre: "Primero A" }];
const yo = { id: "yo", nombre: "Ana", apellido: "Gómez", rol: "docente" };
const otra = { id: "ot", nombre: "Marta", apellido: "Ruiz", rol: "tutor" };
const msg = (id, cuerpo, enviado_en, autor = otra) => ({
  id,
  conversacion_id: "k1",
  cuerpo,
  enviado_en,
  autor,
});
const pagina = (datos, extra = {}) => [
  200,
  { datos, total: datos.length, pagina: 1, por_pagina: 25, ...extra },
];

let cable;
beforeEach(() => {
  cable = {
    url: null,
    parametros: null,
    callbacks: null,
    desuscrito: false,
    desconectado: false,
  };
  createConsumer.mockImplementation((url) => {
    cable.url = url;
    return {
      subscriptions: {
        create: (parametros, callbacks) => {
          cable.parametros = parametros;
          cable.callbacks = callbacks;
          return {
            unsubscribe: () => {
              cable.desuscrito = true;
            },
          };
        },
      },
      disconnect: () => {
        cable.desconectado = true;
      },
    };
  });
});

function dibujar(ruta, rol = "docente") {
  const valor = {
    panel: panelDe(rol, { cursos }),
    sesion: { usuario_id: "yo", token: "tok" },
    api: crearApi({ obtenerToken: () => "tok" }),
  };
  return render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/conversaciones" element={<Conversaciones />} />
          <Route path="/conversaciones/:id" element={<Conversacion />} />
        </Routes>
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
}

const HISTORIAL = "GET /conversaciones/k1/mensajes?pagina=1&por_pagina=25";

describe("CP-RF-25 · los canales de la persona", () => {
  it("lista sus canales grupales con el curso y el último mensaje", async () => {
    simularApi({
      "GET /conversaciones?pagina=1&por_pagina=25": pagina([
        {
          id: "k1",
          curso_id: "c1",
          tipo: "grupal_de_tutores",
          estado: "activa",
          ultimo_mensaje: msg("m9", "Hasta mañana", "2026-03-02T15:30:00Z"),
        },
      ]),
    });
    dibujar("/conversaciones");

    const enlace = await screen.findByRole("link", { name: /Primero A/ });
    expect(enlace).toHaveAttribute("href", "/conversaciones/k1");
    expect(screen.getByText(/Marta Ruiz: Hasta mañana/)).toBeInTheDocument();
    expect(screen.getByText("02/03/2026 12:30")).toBeInTheDocument();
  });

  it("un canal sin mensajes todavía lo dice", async () => {
    simularApi({
      "GET /conversaciones?pagina=1&por_pagina=25": pagina([
        {
          id: "k1",
          curso_id: "c1",
          tipo: "grupal_de_tutores",
          estado: "activa",
          ultimo_mensaje: null,
        },
      ]),
    });
    dibujar("/conversaciones");

    expect(
      await screen.findByText("Todavía no hay mensajes."),
    ).toBeInTheDocument();
  });

  it("sin canales lo dice", async () => {
    simularApi({ "GET /conversaciones?pagina=1&por_pagina=25": pagina([]) });
    dibujar("/conversaciones");

    expect(
      await screen.findByText("No hay canales grupales."),
    ).toBeInTheDocument();
  });

  it("un error se presenta sin detalle interno", async () => {
    simularApi({
      "GET /conversaciones?pagina=1&por_pagina=25": [
        500,
        { status: 500, detail: "PG::Error" },
      ],
    });
    dibujar("/conversaciones");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No fue posible completar la operación.",
    );
  });

  it("mientras llega lo indica", () => {
    global.fetch = jest.fn(() => new Promise(() => {}));
    dibujar("/conversaciones");

    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });
});

describe("CP-RF-28 · historial del canal", () => {
  it("presenta los mensajes del más antiguo al más reciente, con su autor y hora de Asunción", async () => {
    simularApi({
      [HISTORIAL]: pagina([
        msg("m2", "Segundo", "2026-03-02T15:02:00Z"),
        msg("m1", "Primero", "2026-03-02T15:01:00Z", yo),
      ]),
    });
    dibujar("/conversaciones/k1");

    await screen.findByText("Primero");
    const lista = within(screen.getByRole("list", { name: "Mensajes" }));
    expect(lista.getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      expect.stringContaining("PropioDocentePrimero"),
      expect.stringContaining("Marta RuizSegundo"),
    ]);
    expect(screen.getByText("02/03/2026 12:01")).toBeInTheDocument();
  });

  it("distingue el mensaje propio del ajeno y señala al docente", async () => {
    const docenteAjena = {
      id: "dc",
      nombre: "Lucía",
      apellido: "Paz",
      rol: "docente",
    };
    simularApi({
      [HISTORIAL]: pagina([
        msg("m1", "Mío", "2026-03-02T15:01:00Z", yo),
        msg("m2", "De tutora", "2026-03-02T15:02:00Z"),
        msg("m3", "De docente", "2026-03-02T15:03:00Z", docenteAjena),
      ]),
    });
    dibujar("/conversaciones/k1", "tutor");

    await screen.findByText("Mío");
    const [propio, tutora, docente] = screen.getAllByRole("listitem");
    expect(propio).toHaveClass("self-end");
    expect(tutora).toHaveClass("self-start");
    expect(within(tutora).queryByText("Docente")).not.toBeInTheDocument();
    expect(within(docente).getByText("Docente")).toBeInTheDocument();
    expect(within(docente).getByText("Lucía Paz")).toBeInTheDocument();
  });

  it("un canal sin mensajes invita a escribir el primero", async () => {
    simularApi({ [HISTORIAL]: pagina([]) });
    dibujar("/conversaciones/k1");

    expect(
      await screen.findByText("Todavía no hay mensajes."),
    ).toBeInTheDocument();
  });

  it("carga los mensajes anteriores de a una página y los pone antes de los ya presentes", async () => {
    simularApi({
      [HISTORIAL]: pagina([msg("m30", "Reciente", "2026-03-02T15:30:00Z")], {
        total: 30,
      }),
      "GET /conversaciones/k1/mensajes?pagina=2&por_pagina=25": pagina(
        [msg("m1", "Antiguo", "2026-03-02T15:01:00Z")],
        { total: 30, pagina: 2 },
      ),
    });
    dibujar("/conversaciones/k1");
    await screen.findByText("Reciente");

    fireEvent.click(
      screen.getByRole("button", { name: "Ver mensajes anteriores" }),
    );

    await screen.findByText("Antiguo");
    const textos = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(textos[0]).toContain("Antiguo");
    expect(textos[1]).toContain("Reciente");
    expect(
      screen.queryByRole("button", { name: "Ver mensajes anteriores" }),
    ).not.toBeInTheDocument();
  });

  it("no ofrece cargar anteriores si ya está todo", async () => {
    simularApi({
      [HISTORIAL]: pagina([msg("m1", "Único", "2026-03-02T15:01:00Z")]),
    });
    dibujar("/conversaciones/k1");
    await screen.findByText("Único");

    expect(
      screen.queryByRole("button", { name: "Ver mensajes anteriores" }),
    ).not.toBeInTheDocument();
  });

  it("no ofrece adjuntos, conversaciones privadas ni contador de no leídos: RF-30, RF-26, RF-27 y RF-47 son Should have", async () => {
    simularApi({ [HISTORIAL]: pagina([]) });
    dibujar("/conversaciones/k1");
    await screen.findByText("Todavía no hay mensajes.");

    expect(screen.queryByText(/adjunt/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/privad/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no le[ií]dos/i)).not.toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it("una conversación ajena responde 403 y se presenta como tal (RF-29)", async () => {
    simularApi({ [HISTORIAL]: [403, { status: 403, detail: "x" }] });
    dibujar("/conversaciones/k1");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El rol de esta cuenta no habilita esta operación.",
    );
  });

  it("mientras llega lo indica", () => {
    global.fetch = jest.fn(() => new Promise(() => {}));
    dibujar("/conversaciones/k1");

    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });
});

describe("CP-RF-28 · enviar un mensaje", () => {
  it("lo envía, lo presenta y deja vacío el campo", async () => {
    const llamadas = simularApi({
      [HISTORIAL]: pagina([]),
      "POST /conversaciones/k1/mensajes": [
        201,
        msg("m1", "Buenos días", "2026-03-02T15:01:00Z", yo),
      ],
    });
    dibujar("/conversaciones/k1");
    await screen.findByText("Todavía no hay mensajes.");

    fireEvent.change(screen.getByLabelText("Mensaje"), {
      target: { value: "Buenos días" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(
      await within(
        await screen.findByRole("list", { name: "Mensajes" }),
      ).findByText("Buenos días"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Mensaje")).toHaveValue("");
    expect(
      llamadas.find((l) => l.clave === "POST /conversaciones/k1/mensajes")
        .cuerpo,
    ).toEqual({ cuerpo: "Buenos días" });
  });

  it("un mensaje en blanco no se envía", async () => {
    const llamadas = simularApi({ [HISTORIAL]: pagina([]) });
    dibujar("/conversaciones/k1");
    await screen.findByText("Todavía no hay mensajes.");

    fireEvent.change(screen.getByLabelText("Mensaje"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(llamadas.some((l) => l.clave.startsWith("POST"))).toBe(false);
  });

  it("si la interfaz lo rechaza se informa y se conserva lo escrito", async () => {
    simularApi({
      [HISTORIAL]: pagina([]),
      "POST /conversaciones/k1/mensajes": [403, { status: 403, detail: "x" }],
    });
    dibujar("/conversaciones/k1");
    await screen.findByText("Todavía no hay mensajes.");

    fireEvent.change(screen.getByLabelText("Mensaje"), {
      target: { value: "Hola" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El rol de esta cuenta no habilita esta operación.",
    );
    expect(screen.getByLabelText("Mensaje")).toHaveValue("Hola");
  });

  it("mientras envía no admite otro envío", async () => {
    simularApi({ [HISTORIAL]: pagina([]) });
    dibujar("/conversaciones/k1");
    await screen.findByText("Todavía no hay mensajes.");
    global.fetch = jest.fn(() => new Promise(() => {}));

    fireEvent.change(screen.getByLabelText("Mensaje"), {
      target: { value: "Hola" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(
      await screen.findByRole("button", { name: "Enviar" }),
    ).toBeDisabled();
  });
});

describe("CP-RF-25 · tiempo real por el canal (Figura 8)", () => {
  it("se conecta con el token y se suscribe a la conversación", async () => {
    simularApi({ [HISTORIAL]: pagina([]) });
    dibujar("/conversaciones/k1");
    await screen.findByText("Todavía no hay mensajes.");

    expect(cable.url).toBe("/cable?token=tok");
    expect(cable.parametros).toEqual({
      channel: "ConversacionChannel",
      conversacion_id: "k1",
    });
  });

  it("un mensaje que llega por el canal se agrega en vivo", async () => {
    simularApi({
      [HISTORIAL]: pagina([msg("m1", "Antes", "2026-03-02T15:01:00Z")]),
    });
    dibujar("/conversaciones/k1");
    await screen.findByText("Antes");

    act(() =>
      cable.callbacks.received(msg("m2", "En vivo", "2026-03-02T15:02:00Z")),
    );

    expect(screen.getByText("En vivo")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("el mensaje propio, que llega por el canal y por la respuesta del envío, se presenta una sola vez", async () => {
    simularApi({
      [HISTORIAL]: pagina([]),
      "POST /conversaciones/k1/mensajes": [
        201,
        msg("m1", "Hola", "2026-03-02T15:01:00Z", yo),
      ],
    });
    dibujar("/conversaciones/k1");
    await screen.findByText("Todavía no hay mensajes.");

    fireEvent.change(screen.getByLabelText("Mensaje"), {
      target: { value: "Hola" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    const lista = await screen.findByRole("list", { name: "Mensajes" });
    act(() =>
      cable.callbacks.received(msg("m1", "Hola", "2026-03-02T15:01:00Z", yo)),
    );

    expect(within(lista).getAllByText("Hola")).toHaveLength(1);
  });

  it("declara si está en vivo o sin conexión", async () => {
    simularApi({ [HISTORIAL]: pagina([]) });
    dibujar("/conversaciones/k1");
    await screen.findByText("Todavía no hay mensajes.");

    expect(screen.getByText("Conectando…")).toBeInTheDocument();
    act(() => cable.callbacks.connected());
    expect(screen.getByText("En vivo")).toBeInTheDocument();
    act(() => cable.callbacks.disconnected());
    expect(
      screen.getByText(
        "Sin conexión en tiempo real. Los mensajes se ven al reconectar.",
      ),
    ).toBeInTheDocument();
  });

  it("al reconectar vuelve a pedir el historial, para no perder lo que llegó mientras tanto (RN-27)", async () => {
    const llamadas = simularApi({
      [HISTORIAL]: pagina([msg("m1", "Antes", "2026-03-02T15:01:00Z")]),
    });
    dibujar("/conversaciones/k1");
    await screen.findByText("Antes");
    act(() => cable.callbacks.connected());
    act(() => cable.callbacks.disconnected());
    global.fetch.mockClear();
    global.fetch.mockImplementation(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        datos: [
          msg("m2", "Perdido", "2026-03-02T15:02:00Z"),
          msg("m1", "Antes", "2026-03-02T15:01:00Z"),
        ],
        total: 2,
        pagina: 1,
        por_pagina: 25,
      }),
    }));

    await act(async () => cable.callbacks.connected());

    expect(await screen.findByText("Perdido")).toBeInTheDocument();
    expect(llamadas.length).toBeGreaterThan(0);
  });

  it("si la interfaz rechaza la suscripción lo informa", async () => {
    simularApi({ [HISTORIAL]: pagina([]) });
    dibujar("/conversaciones/k1");
    await screen.findByText("Todavía no hay mensajes.");

    act(() => cable.callbacks.rejected());

    expect(screen.getByRole("alert")).toHaveTextContent(
      "El rol de esta cuenta no habilita esta operación.",
    );
  });

  it("al salir de la conversación se desuscribe y cierra la conexión", async () => {
    simularApi({ [HISTORIAL]: pagina([]) });
    const { unmount } = dibujar("/conversaciones/k1");
    await screen.findByText("Todavía no hay mensajes.");

    unmount();

    expect(cable.desuscrito).toBe(true);
    expect(cable.desconectado).toBe(true);
  });
});
