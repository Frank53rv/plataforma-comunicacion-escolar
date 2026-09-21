// RF-40 Paneles diferenciados por rol · RF-41 Interfaz responsiva · CU-09 · RN-04, RN-15
// Prueba: CP-RF-40
//
// RF-40 (Tabla 10) · «El cliente debe presentar paneles con las funciones correspondientes
// al rol de la persona autenticada, sin exponer opciones ajenas a él.» Fig. 13 · el cliente
// «no implementa reglas de negocio ni decisiones de autorización»: dibuja lo que la interfaz
// de programación habilitó en GET /paneles/me y nada más.
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Armazon from "../comun/Armazon.jsx";
import { ContextoSesion } from "../comun/contextoSesion.js";
import { panelDe } from "./ayudas.js";

const secciones = {
  anuncios: { etiqueta: "Anuncios", ruta: "/", elemento: () => null },
  conversaciones: {
    etiqueta: "Canal grupal",
    ruta: "/canal",
    elemento: () => null,
  },
  supervision: {
    etiqueta: "Supervisión",
    ruta: "/supervision",
    elemento: () => null,
  },
};

function dibujar(panel, extra = {}) {
  const valor = { panel, errorPanel: null, cerrar: jest.fn(), ...extra };
  render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter>
        <Armazon secciones={secciones} />
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
  return valor;
}

const enlaces = () =>
  screen.queryAllByRole("link").map((enlace) => enlace.textContent);

describe("CP-RF-40 · las opciones del panel", () => {
  it("dibuja las que la interfaz habilitó y el cliente sabe presentar, en el orden recibido", () => {
    dibujar(
      panelDe("docente", {
        opciones_habilitadas: ["anuncios", "conversaciones"],
      }),
    );

    expect(enlaces()).toEqual(["Anuncios", "Canal grupal"]);
  });

  it("no dibuja una opción que el cliente conoce pero la interfaz no habilitó", () => {
    dibujar(panelDe("tutor", { opciones_habilitadas: ["anuncios"] }));

    expect(enlaces()).not.toContain("Supervisión");
  });

  it("no inventa una opción que la interfaz habilitó y el cliente todavía no presenta", () => {
    dibujar(
      panelDe("docente", {
        opciones_habilitadas: ["anuncios", "publicar_anuncio"],
      }),
    );

    expect(enlaces()).toEqual(["Anuncios"]);
  });

  it("sin opciones habilitadas no hay ninguna: el cliente no agrega las suyas", () => {
    dibujar(panelDe("alumno", { opciones_habilitadas: [] }));

    expect(enlaces()).toEqual([]);
  });

  it.each([
    ["directivo", "Directivo"],
    ["docente", "Docente"],
    ["tutor", "Tutor"],
    ["alumno", "Alumno"],
  ])("presenta el rol %s", (rol, etiqueta) => {
    dibujar(panelDe(rol));

    expect(
      screen.getByText(new RegExp(`Ana · ${etiqueta}`)),
    ).toBeInTheDocument();
  });
});

describe("armazón", () => {
  it("cerrar sesión llama a la sesión", () => {
    const valor = dibujar(panelDe("tutor"));

    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(valor.cerrar).toHaveBeenCalled();
  });

  it("en pantallas angostas el menú se abre y se cierra, y lo declara para los lectores de pantalla (RF-41)", () => {
    dibujar(panelDe("tutor", { opciones_habilitadas: ["anuncios"] }));
    const menu = screen.getByRole("button", { name: "Menú" });

    expect(menu).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("link", { name: "Anuncios" }));
    expect(menu).toHaveAttribute("aria-expanded", "false");
  });

  it("si el panel no pudo obtenerse, lo informa como alerta", () => {
    dibujar(null, {
      errorPanel: "No fue posible comunicarse con el servidor.",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No fue posible comunicarse con el servidor.",
    );
  });
});
