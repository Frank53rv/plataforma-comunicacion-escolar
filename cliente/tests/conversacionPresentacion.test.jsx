// RF-25 Canal grupal del curso · RF-28 Persistencia e historial de mensajes · CU-12 · RN-23,
// RN-27
// Prueba: CP-RF-25 · CP-RF-28
//
// Presentación del canal grupal a pantalla completa: burbujas agrupadas por autor, redactor
// fijo abajo y desplazamiento propio del historial. Enter envía sólo donde hay un puntero
// fino (escritorio); en pantallas táctiles agrega una línea y envía el botón. jsdom no trae
// matchMedia ni scrollIntoView: las pruebas los simulan.
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createConsumer } from "@rails/actioncable";
import { MemoryRouter, Route, Routes } from "react-router";
import Conversacion from "../conversacion/Conversacion.jsx";
import { crearApi } from "../comun/api.js";
import { ContextoSesion } from "../comun/contextoSesion.js";
import { panelDe, simularApi } from "./ayudas.js";

jest.mock("@rails/actioncable", () => ({ createConsumer: jest.fn() }));

const yo = { id: "yo", nombre: "Ana", apellido: "Gómez", rol: "tutor" };
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
const HISTORIAL = "GET /conversaciones/k1/mensajes?pagina=1&por_pagina=25";
const ENVIO = "POST /conversaciones/k1/mensajes";

let alRecibir;
beforeEach(() => {
  createConsumer.mockImplementation(() => ({
    subscriptions: {
      create: (_parametros, callbacks) => {
        alRecibir = callbacks.received;
        return { unsubscribe: () => {} };
      },
    },
    disconnect: () => {},
  }));
  Element.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
  delete Element.prototype.scrollIntoView;
  delete window.matchMedia;
});

function punteroFino(fino) {
  window.matchMedia = jest.fn((consulta) => ({
    matches: consulta === "(pointer: fine)" && fino,
    media: consulta,
  }));
}

function dibujar() {
  const valor = {
    panel: panelDe("tutor", { cursos: [{ id: "c1", nombre: "Primero A" }] }),
    sesion: { usuario_id: "yo", token: "tok" },
    api: crearApi({ obtenerToken: () => "tok" }),
  };
  return render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter
        initialEntries={[
          { pathname: "/conversaciones/k1", state: { curso: "Primero A" } },
        ]}
      >
        <Routes>
          <Route path="/conversaciones/:id" element={<Conversacion />} />
        </Routes>
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
}

const redactor = () => screen.getByLabelText("Mensaje");
const envios = (llamadas) => llamadas.filter((l) => l.clave === ENVIO);

describe("CP-RF-28 · el redactor", () => {
  const respuestas = {
    [HISTORIAL]: pagina([]),
    [ENVIO]: [201, msg("m1", "Hola", "2026-03-02T15:01:00Z", yo)],
  };

  it("con puntero fino, Enter envía", async () => {
    punteroFino(true);
    const llamadas = simularApi(respuestas);
    dibujar();
    await screen.findByText("Todavía no hay mensajes.");

    fireEvent.change(redactor(), { target: { value: "Hola" } });
    fireEvent.keyDown(redactor(), { key: "Enter" });

    expect(
      await within(
        await screen.findByRole("list", { name: "Mensajes" }),
      ).findByText("Hola"),
    ).toBeInTheDocument();
    expect(envios(llamadas)).toHaveLength(1);
  });

  it("con puntero fino, Mayús+Enter agrega una línea y no envía", async () => {
    punteroFino(true);
    const llamadas = simularApi(respuestas);
    dibujar();
    await screen.findByText("Todavía no hay mensajes.");

    fireEvent.change(redactor(), { target: { value: "Hola" } });
    fireEvent.keyDown(redactor(), { key: "Enter", shiftKey: true });

    expect(envios(llamadas)).toHaveLength(0);
  });

  it("mientras se compone un carácter, Enter no envía", async () => {
    punteroFino(true);
    const llamadas = simularApi(respuestas);
    dibujar();
    await screen.findByText("Todavía no hay mensajes.");

    fireEvent.change(redactor(), { target: { value: "Hola" } });
    fireEvent.keyDown(redactor(), { key: "Enter", isComposing: true });

    expect(envios(llamadas)).toHaveLength(0);
  });

  it("en pantalla táctil, Enter agrega una línea: sólo envía el botón", async () => {
    punteroFino(false);
    const llamadas = simularApi(respuestas);
    dibujar();
    await screen.findByText("Todavía no hay mensajes.");

    fireEvent.change(redactor(), { target: { value: "Hola" } });
    fireEvent.keyDown(redactor(), { key: "Enter" });
    expect(envios(llamadas)).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(
      await within(
        await screen.findByRole("list", { name: "Mensajes" }),
      ).findByText("Hola"),
    ).toBeInTheDocument();
  });

  it("sin matchMedia, Enter no envía", async () => {
    const llamadas = simularApi(respuestas);
    dibujar();
    await screen.findByText("Todavía no hay mensajes.");

    fireEvent.change(redactor(), { target: { value: "Hola" } });
    fireEvent.keyDown(redactor(), { key: "Enter" });

    expect(envios(llamadas)).toHaveLength(0);
  });

  it("otra tecla no hace nada", async () => {
    punteroFino(true);
    const llamadas = simularApi(respuestas);
    dibujar();
    await screen.findByText("Todavía no hay mensajes.");

    fireEvent.keyDown(redactor(), { key: "a" });

    expect(envios(llamadas)).toHaveLength(0);
  });

  it("el redactor es una fila que crece con el texto y su etiqueta queda para lectores de pantalla", async () => {
    simularApi(respuestas);
    dibujar();
    await screen.findByText("Todavía no hay mensajes.");

    expect(redactor()).toHaveAttribute("rows", "1");
    expect(redactor()).toHaveClass("field-sizing-content", "max-h-40");
    expect(screen.getByText("Mensaje")).toHaveClass("sr-only");
  });
});

describe("CP-RF-28 · burbujas agrupadas por autor", () => {
  it("el nombre se ve en la primera burbuja del grupo y en las siguientes sólo para lectores de pantalla", async () => {
    simularApi({
      [HISTORIAL]: pagina([
        msg("m1", "Uno", "2026-03-02T15:01:00Z"),
        msg("m2", "Dos", "2026-03-02T15:02:00Z"),
        msg("m3", "Tres", "2026-03-02T15:03:00Z", yo),
      ]),
    });
    dibujar();
    await screen.findByText("Uno");

    const [uno, dos, tres] = within(
      screen.getByRole("list", { name: "Mensajes" }),
    ).getAllByRole("listitem");
    expect(within(uno).getByText("Marta Ruiz").closest("p")).not.toHaveClass(
      "sr-only",
    );
    expect(within(dos).getByText("Marta Ruiz").closest("p")).toHaveClass(
      "sr-only",
    );
    expect(uno).toHaveClass("mt-3");
    expect(dos).toHaveClass("mt-0.5");
    expect(tres).toHaveClass("mt-3", "self-end");
    expect(within(tres).getByText("Propio")).toHaveClass("sr-only");
  });

  it("el avatar acompaña sólo a la primera burbuja ajena del grupo", async () => {
    simularApi({
      [HISTORIAL]: pagina([
        msg("m1", "Uno", "2026-03-02T15:01:00Z"),
        msg("m2", "Dos", "2026-03-02T15:02:00Z"),
      ]),
    });
    dibujar();
    await screen.findByText("Uno");

    const [uno, dos] = screen.getAllByRole("listitem");
    expect(within(uno).getByText("MR")).toHaveAttribute("aria-hidden", "true");
    expect(within(dos).queryByText("MR")).not.toBeInTheDocument();
  });
});

describe("CP-RF-28 · desplazamiento del historial", () => {
  it("lleva al final cuando llega un mensaje nuevo", async () => {
    simularApi({
      [HISTORIAL]: pagina([msg("m1", "Antes", "2026-03-02T15:01:00Z")]),
    });
    dibujar();
    await screen.findByText("Antes");
    Element.prototype.scrollIntoView.mockClear();

    act(() => alRecibir(msg("m2", "Nuevo", "2026-03-02T15:02:00Z")));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("al cargar mensajes anteriores no salta al final y conserva la posición", async () => {
    simularApi({
      [HISTORIAL]: pagina([msg("m30", "Reciente", "2026-03-02T15:30:00Z")], {
        total: 30,
      }),
      "GET /conversaciones/k1/mensajes?pagina=2&por_pagina=25": pagina(
        [msg("m1", "Antiguo", "2026-03-02T15:01:00Z")],
        { total: 30, pagina: 2 },
      ),
    });
    dibujar();
    await screen.findByText("Reciente");
    const historial = screen
      .getByRole("list", { name: "Mensajes" })
      .closest(".overflow-y-auto");
    let altura = 500;
    Object.defineProperty(historial, "scrollHeight", {
      configurable: true,
      get: () => altura,
    });
    historial.scrollTop = 40;
    Element.prototype.scrollIntoView.mockClear();

    fireEvent.click(
      screen.getByRole("button", { name: "Ver mensajes anteriores" }),
    );
    altura = 800;
    await screen.findByText("Antiguo");

    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    expect(historial.scrollTop).toBe(340);
  });
});

describe("CP-RF-28 · desplazamiento tras un fallo", () => {
  it("si los anteriores no llegan, lo informa y un mensaje nuevo no hereda la posición pendiente", async () => {
    simularApi({
      [HISTORIAL]: pagina([msg("m30", "Reciente", "2026-03-02T15:30:00Z")], {
        total: 30,
      }),
      "GET /conversaciones/k1/mensajes?pagina=2&por_pagina=25": [
        500,
        { status: 500, detail: "x" },
      ],
    });
    dibujar();
    await screen.findByText("Reciente");
    const historial = screen
      .getByRole("list", { name: "Mensajes" })
      .closest(".overflow-y-auto");
    Object.defineProperty(historial, "scrollHeight", {
      configurable: true,
      get: () => 500,
    });
    historial.scrollTop = 40;

    fireEvent.click(
      screen.getByRole("button", { name: "Ver mensajes anteriores" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No fue posible completar la operación.",
    );
    historial.scrollTop = 100;
    act(() => alRecibir(msg("m31", "Nuevo", "2026-03-02T15:31:00Z")));

    expect(historial.scrollTop).toBe(100);
  });
});

describe("CP-RF-25 · barra del canal", () => {
  it("la vuelta es una flecha con nombre accesible y el estado va como subtítulo", async () => {
    simularApi({ [HISTORIAL]: pagina([]) });
    dibujar();
    await screen.findByText("Todavía no hay mensajes.");

    const volver = screen.getByRole("link", { name: "Volver a los canales" });
    expect(volver).toHaveAttribute("href", "/conversaciones");
    expect(volver.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(
      screen.getByRole("heading", { name: "Canal grupal · Primero A" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Conectando…")).toHaveAttribute("role", "status");
  });
});
