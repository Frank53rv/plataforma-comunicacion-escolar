// RF-17 Publicación de anuncios · CU-06 · RN-16, RN-17,
// RN-18, RN-19
// Prueba: CP-RF-17
//
// TC-11 (Tabla 17) · «Publicar un anuncio dirigido a uno o varios de sus cursos». RF-17 · la
// publicación resuelve sus destinatarios; el cliente sólo pide y presenta el resultado. RF-18
// (programar la hora de envío) y RF-30 (adjuntos) son Should have: no se ofrecen.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Publicar from "../paneles/docente/Publicar.jsx";
import { crearApi } from "../comun/api.js";
import { ContextoSesion } from "../comun/contextoSesion.js";
import { panelDe, simularApi } from "./ayudas.js";

const cursos = [
  { id: "c1", nombre: "Primero A" },
  { id: "c2", nombre: "Primero B" },
];

function dibujar(extraPanel = {}) {
  const valor = {
    panel: panelDe("docente", { cursos, ...extraPanel }),
    api: crearApi({ obtenerToken: () => "tok" }),
  };
  return render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter>
        <Publicar />
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
}

function escribir(etiqueta, valor) {
  fireEvent.change(screen.getByLabelText(etiqueta), {
    target: { value: valor },
  });
}

const publicado = (extra = {}) => ({
  id: "a1",
  estado: "publicado",
  anuncio_version: {
    id: "v1",
    titulo: "Reunión",
    cuerpo: "Viernes.",
    publicado_en: "2026-03-02T15:30:00Z",
  },
  destinatarios_resueltos: 12,
  ...extra,
});

describe("CP-RF-17 · publicar un anuncio", () => {
  it("ofrece los cursos del docente, y sólo los suyos", () => {
    dibujar();

    expect(
      screen.getByRole("checkbox", { name: "Primero A" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Primero B" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });

  it("publica el anuncio dirigido a los cursos elegidos, en una sola petición", async () => {
    const llamadas = simularApi({ "POST /anuncios": [201, publicado()] });
    dibujar();

    escribir("Título", "Reunión");
    escribir("Cuerpo", "Viernes.");
    fireEvent.click(screen.getByRole("checkbox", { name: "Primero A" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Primero B" }));
    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));

    expect(
      await screen.findByText("Anuncio publicado. Destinatarios: 12."),
    ).toBeInTheDocument();
    expect(llamadas[0].cuerpo).toEqual({
      titulo: "Reunión",
      cuerpo: "Viernes.",
      cursos: ["c1", "c2"],
    });
  });

  it("tras publicar permite ver el anuncio y publicar otro con el formulario vacío", async () => {
    simularApi({ "POST /anuncios": [201, publicado()] });
    dibujar();
    escribir("Título", "Reunión");
    escribir("Cuerpo", "Viernes.");
    fireEvent.click(screen.getByRole("checkbox", { name: "Primero A" }));
    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));

    expect(
      await screen.findByRole("link", { name: "Ver el anuncio" }),
    ).toHaveAttribute("href", "/anuncios/a1");
    fireEvent.click(
      screen.getByRole("button", { name: "Publicar otro anuncio" }),
    );

    expect(screen.getByLabelText("Título")).toHaveValue("");
    expect(
      screen.getByRole("checkbox", { name: "Primero A" }),
    ).not.toBeChecked();
  });

  it("sin elegir ningún curso no pide nada y lo indica", () => {
    const llamadas = simularApi({});
    dibujar();
    escribir("Título", "Reunión");
    escribir("Cuerpo", "Viernes.");

    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Elegir al menos un curso.",
    );
    expect(llamadas).toEqual([]);
  });

  it("un dato inaceptable lo informa la interfaz y se presenta, sin perder lo escrito", async () => {
    simularApi({
      "POST /anuncios": [
        422,
        { status: 422, detail: "Falta el campo obligatorio: titulo." },
      ],
    });
    dibujar();
    escribir("Cuerpo", "Viernes.");
    fireEvent.click(screen.getByRole("checkbox", { name: "Primero A" }));

    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Falta el campo obligatorio: titulo.",
    );
    expect(screen.getByLabelText("Cuerpo")).toHaveValue("Viernes.");
  });

  it("dirigirlo a un curso al que no está vinculado responde 403 y se presenta como tal (CU-06 E1)", async () => {
    simularApi({ "POST /anuncios": [403, { status: 403, detail: "x" }] });
    dibujar();
    escribir("Título", "T");
    escribir("Cuerpo", "C");
    fireEvent.click(screen.getByRole("checkbox", { name: "Primero A" }));

    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El rol de esta cuenta no habilita esta operación.",
    );
  });

  it("mientras publica no admite un segundo envío", async () => {
    global.fetch = jest.fn(() => new Promise(() => {}));
    dibujar();
    escribir("Título", "T");
    escribir("Cuerpo", "C");
    fireEvent.click(screen.getByRole("checkbox", { name: "Primero A" }));

    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Publicar" })).toBeDisabled(),
    );
  });

  it("no ofrece programar el envío ni adjuntar archivos: RF-18 y RF-30 son Should have", () => {
    dibujar();

    expect(screen.queryByText(/program/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/adjunt/i)).not.toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it("declara que los anuncios ignoran el horario y las preferencias del destinatario (RN-18)", () => {
    dibujar();

    expect(
      screen.getByText(/ignoran el horario de disponibilidad/i),
    ).toBeInTheDocument();
  });

  it("un docente sin cursos lo dice y no permite publicar", () => {
    dibujar({ cursos: [] });

    expect(
      screen.getByText("No hay cursos a los que dirigir un anuncio."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publicar" })).toBeDisabled();
  });
});
