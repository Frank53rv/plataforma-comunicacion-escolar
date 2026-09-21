// RF-39 Bandeja de anuncios · RF-22 · RF-36 Idempotencia de eventos · CU-09, CU-10 · RN-15, RN-32
// Prueba: CP-RF-39 · CP-RF-22 · CP-RF-36
//
// CU-10 (Tabla 13) · «Los estados vista y leída quedan registrados con marca de tiempo, de
// forma monótona e idempotente.» El cliente emite la lectura al abrir el detalle; que la
// reemisión no altere la marca original es de la interfaz de programación (RF-36).
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import Detalle from "../anuncios/Detalle.jsx";
import { crearApi } from "../comun/api.js";
import { ContextoSesion } from "../comun/contextoSesion.js";
import { panelDe, simularApi } from "./ayudas.js";

const anuncio = (extra = {}) => ({
  id: "a1",
  autor_id: "d1",
  estado: "publicado",
  version: {
    id: "v1",
    anuncio_id: "a1",
    numero_version: 1,
    titulo: "Reunión de padres",
    cuerpo: "Será el viernes.\nTraer el cuaderno.",
    publicado_en: "2026-03-02T15:30:00Z",
  },
  cursos: [
    { id: "c1", nombre: "Primero A" },
    { id: "c2", nombre: "Primero B" },
  ],
  adjuntos: [],
  ...extra,
});

function dibujar(rol = "tutor", estado, usuarioId = "otra-persona") {
  const valor = {
    panel: panelDe(rol),
    sesion: { usuario_id: usuarioId },
    api: crearApi({ obtenerToken: () => "tok" }),
  };
  return render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter
        initialEntries={[{ pathname: "/anuncios/a1", state: estado }]}
      >
        <Routes>
          <Route path="/" element={<p>bandeja</p>} />
          <Route path="/anuncios/:id" element={<Detalle />} />
        </Routes>
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
}

const autor = { id: "d1", nombre: "Ana", apellido: "Gómez", rol: "docente" };

describe("CP-RF-39 · detalle de un anuncio", () => {
  it("presenta el título, el cuerpo, la fecha en hora de Asunción y los cursos", async () => {
    simularApi({
      "GET /anuncios/a1": [200, anuncio()],
      "POST /entregas/lecturas": [200, {}],
    });
    dibujar("tutor", { autor });

    expect(
      await screen.findByRole("heading", { name: "Reunión de padres" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Será el viernes\./)).toBeInTheDocument();
    expect(screen.getByText("02/03/2026 12:30")).toBeInTheDocument();
    expect(screen.getByText("Primero A, Primero B")).toBeInTheDocument();
    expect(screen.getByText("Ana Gómez")).toBeInTheDocument();
  });

  it("abierto directamente, sin pasar por la bandeja, presenta todo salvo el autor que no conoce", async () => {
    simularApi({
      "GET /anuncios/a1": [200, anuncio()],
      "POST /entregas/lecturas": [200, {}],
    });
    dibujar("tutor");

    expect(
      await screen.findByRole("heading", { name: "Reunión de padres" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Publicado por/)).not.toBeInTheDocument();
  });

  it("no ofrece adjuntos: RF-30 es Should have", async () => {
    simularApi({
      "GET /anuncios/a1": [200, anuncio()],
      "POST /entregas/lecturas": [200, {}],
    });
    dibujar("tutor");
    await screen.findByRole("heading", { name: "Reunión de padres" });

    expect(screen.queryByText(/adjunt/i)).not.toBeInTheDocument();
  });

  it("permite volver a la bandeja", async () => {
    simularApi({
      "GET /anuncios/a1": [200, anuncio()],
      "POST /entregas/lecturas": [200, {}],
    });
    dibujar("tutor");

    expect(
      await screen.findByRole("link", { name: "Volver a los anuncios" }),
    ).toHaveAttribute("href", "/");
  });

  it("un anuncio ajeno a las vinculaciones se presenta como inexistente (CU-09 E1, RN-15)", async () => {
    simularApi({ "GET /anuncios/a1": [404, { status: 404, detail: "x" }] });
    dibujar("tutor");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El recurso no existe o no está al alcance de esta cuenta.",
    );
  });

  it("mientras llega lo indica", () => {
    global.fetch = jest.fn(() => new Promise(() => {}));
    dibujar("tutor");

    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });
});

describe("CP-RF-36 · lectura al abrir el detalle", () => {
  it("el tutor y el alumno emiten la lectura de la publicación una sola vez", async () => {
    const llamadas = simularApi({
      "GET /anuncios/a1": [200, anuncio()],
      "POST /entregas/lecturas": [200, {}],
    });
    dibujar("alumno");

    await waitFor(() =>
      expect(llamadas.some((l) => l.clave === "POST /entregas/lecturas")).toBe(
        true,
      ),
    );
    const lecturas = llamadas.filter(
      (l) => l.clave === "POST /entregas/lecturas",
    );
    expect(lecturas).toHaveLength(1);
    expect(lecturas[0].cuerpo).toEqual({ anuncio_version_id: "v1" });
  });

  it("el docente y el directivo no son destinatarios: no emiten lectura", async () => {
    const llamadas = simularApi({ "GET /anuncios/a1": [200, anuncio()] });
    dibujar("docente");
    await screen.findByRole("heading", { name: "Reunión de padres" });

    expect(llamadas.map((l) => l.clave)).toEqual(["GET /anuncios/a1"]);
  });

  it("un anuncio eliminado se declara como tal y no registra lectura", async () => {
    const llamadas = simularApi({
      "GET /anuncios/a1": [200, anuncio({ estado: "eliminado" })],
    });
    dibujar("tutor");

    expect(
      await screen.findByText("Este anuncio fue eliminado."),
    ).toBeInTheDocument();
    expect(llamadas.some((l) => l.clave === "POST /entregas/lecturas")).toBe(
      false,
    );
  });

  it("si la lectura no pudo registrarse, el anuncio se sigue leyendo sin alarma", async () => {
    simularApi({
      "GET /anuncios/a1": [200, anuncio()],
      "POST /entregas/lecturas": [404, { status: 404, detail: "x" }],
    });
    dibujar("tutor");

    expect(
      await screen.findByRole("heading", { name: "Reunión de padres" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("CP-RF-20 · eliminar un anuncio propio, con confirmación explícita (RNF-14)", () => {
  const propio = () => dibujar("docente", undefined, "d1");

  it("el autor ve las acciones: constancias y eliminar", async () => {
    simularApi({ "GET /anuncios/a1": [200, anuncio()] });
    propio();

    expect(
      await screen.findByRole("link", { name: "Constancias" }),
    ).toHaveAttribute("href", "/anuncios/a1/constancias");
    expect(
      screen.getByRole("button", { name: "Eliminar anuncio" }),
    ).toBeInTheDocument();
  });

  it("quien no es el autor no las ve, aunque sea docente", async () => {
    simularApi({ "GET /anuncios/a1": [200, anuncio()] });
    dibujar("docente", undefined, "otro-docente");
    await screen.findByRole("heading", { name: "Reunión de padres" });

    expect(
      screen.queryByRole("button", { name: "Eliminar anuncio" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Constancias" }),
    ).not.toBeInTheDocument();
  });

  it("un anuncio ya eliminado no ofrece acciones", async () => {
    simularApi({ "GET /anuncios/a1": [200, anuncio({ estado: "eliminado" })] });
    propio();
    await screen.findByText("Este anuncio fue eliminado.");

    expect(
      screen.queryByRole("button", { name: "Eliminar anuncio" }),
    ).not.toBeInTheDocument();
  });

  it("eliminar pide confirmación antes de hacer nada, y cancelar la retira", async () => {
    const llamadas = simularApi({ "GET /anuncios/a1": [200, anuncio()] });
    propio();

    fireEvent.click(
      await screen.findByRole("button", { name: "Eliminar anuncio" }),
    );
    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "¿Eliminar este anuncio?",
    );
    expect(llamadas.some((l) => l.clave.startsWith("DELETE"))).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(llamadas.some((l) => l.clave.startsWith("DELETE"))).toBe(false);
  });

  it("confirmada, elimina y vuelve a la bandeja", async () => {
    const llamadas = simularApi({
      "GET /anuncios/a1": [200, anuncio()],
      "DELETE /anuncios/a1": [200, { id: "a1", estado: "eliminado" }],
    });
    propio();

    fireEvent.click(
      await screen.findByRole("button", { name: "Eliminar anuncio" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar eliminación" }),
    );

    expect(await screen.findByText("bandeja")).toBeInTheDocument();
    expect(
      llamadas.filter((l) => l.clave === "DELETE /anuncios/a1"),
    ).toHaveLength(1);
  });

  it("si la interfaz lo rechaza (403), se informa y el anuncio sigue en su lugar", async () => {
    simularApi({
      "GET /anuncios/a1": [200, anuncio()],
      "DELETE /anuncios/a1": [403, { status: 403, detail: "x" }],
    });
    propio();

    fireEvent.click(
      await screen.findByRole("button", { name: "Eliminar anuncio" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar eliminación" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El rol de esta cuenta no habilita esta operación.",
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Reunión de padres" }),
    ).toBeInTheDocument();
  });

  it("mientras elimina no admite otra confirmación", async () => {
    simularApi({ "GET /anuncios/a1": [200, anuncio()] });
    propio();
    await screen.findByRole("button", { name: "Eliminar anuncio" });
    global.fetch = jest.fn(() => new Promise(() => {}));

    fireEvent.click(screen.getByRole("button", { name: "Eliminar anuncio" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar eliminación" }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Confirmar eliminación" }),
      ).toBeDisabled(),
    );
  });
});
