// RF-41 Interfaz responsiva · RF-40 · CU-09 · RN-04
// Prueba: CP-RF-41 · CP-RF-40
//
// El armazón ocupa el alto de la ventana y sólo desplaza el contenido. Dentro de un canal
// grupal, por debajo del ancho grande, cede la pantalla completa al canal: la cabecera y la
// navegación se ocultan con un punto de corte, sin salir del documento, de modo que ninguna
// opción del panel desaparece (RF-40) y en escritorio siguen visibles. jsdom no maqueta: se
// verifican las clases que lo realizan, no el resultado en pantalla.
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Armazon from "../comun/Armazon.jsx";
import { ContextoSesion } from "../comun/contextoSesion.js";
import { panelDe } from "./ayudas.js";

const secciones = {
  anuncios: { etiqueta: "Anuncios", ruta: "/", elemento: () => null },
  conversaciones: {
    etiqueta: "Canal grupal",
    ruta: "/conversaciones",
    elemento: () => null,
  },
};

function dibujar(ruta) {
  const valor = {
    panel: panelDe("tutor", {
      opciones_habilitadas: ["anuncios", "conversaciones"],
    }),
    errorPanel: null,
    cerrar: jest.fn(),
  };
  render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter initialEntries={[ruta]}>
        <Armazon secciones={secciones} />
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
}

const cabecera = () => screen.getByRole("banner");
const navegacion = () => screen.getByRole("navigation", { name: "Secciones" });
const principal = () => screen.getByRole("main");

describe("CP-RF-41 · armazón de alto completo", () => {
  it("ocupa el alto de la ventana y sólo desplaza el contenido", () => {
    dibujar("/");

    expect(principal().parentElement.parentElement).toHaveClass("h-dvh");
    expect(principal()).toHaveClass("min-h-0", "overflow-y-auto");
  });

  it("fuera de un canal, cabecera y navegación se ven en todos los anchos", () => {
    dibujar("/");

    expect(cabecera()).not.toHaveClass("max-lg:hidden");
    expect(navegacion()).not.toHaveClass("max-lg:hidden");
    expect(principal()).toHaveClass("p-4");
  });

  it("la lista de canales todavía no es un canal: conserva cabecera y navegación", () => {
    dibujar("/conversaciones");

    expect(cabecera()).not.toHaveClass("max-lg:hidden");
  });

  it("dentro de un canal, en anchos menores cede la pantalla completa al canal", () => {
    dibujar("/conversaciones/k1");

    expect(cabecera()).toHaveClass("max-lg:hidden");
    expect(navegacion()).toHaveClass("max-lg:hidden");
    expect(principal()).not.toHaveClass("p-4");
  });

  it("aun oculta en el canal, ninguna opción ni acción sale del documento", () => {
    dibujar("/conversaciones/k1");

    expect(screen.getByRole("button", { name: "Menú" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cerrar sesión" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Canal grupal" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
