// RF-41 Interfaz responsiva · RF-40 Paneles diferenciados por rol · CU-09 · RN-04, RN-15
// Prueba: CP-RF-41 · CP-RF-40
//
// En pantallas angostas la navegación es una barra inferior con los destinos de uso diario de
// cada rol; el resto queda bajo «Menú». Es una sola lista de enlaces, en el orden que la
// interfaz de programación declaró: el cliente sólo decide qué se ve primero, nunca agrega una
// opción (RNF-21).
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Armazon from "../comun/Armazon.jsx";
import { ContextoSesion } from "../comun/contextoSesion.js";
import { panelDe } from "./ayudas.js";

const DIRECTIVO = [
  "anuncios",
  "preferencias",
  "supervision",
  "anios_lectivos",
  "cursos",
  "docentes",
  "alumnos",
];
const DOCENTE = [
  "anuncios",
  "publicar_anuncio",
  "constancias",
  "conversaciones",
  "preferencias",
  "cursos",
  "alumnos",
];

function dibujar(rol, opciones) {
  const valor = {
    panel: panelDe(rol, { opciones_habilitadas: opciones }),
    errorPanel: null,
    cerrar: jest.fn(),
  };
  render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter>
        <Armazon />
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
}

const todos = () => screen.queryAllByRole("link");
const aLaVista = () =>
  todos()
    .filter(
      (enlace) => !enlace.closest("li").classList.contains("max-md:hidden"),
    )
    .map((enlace) => enlace.textContent);
const bajoMenu = () =>
  todos()
    .filter((enlace) =>
      enlace.closest("li").classList.contains("max-md:hidden"),
    )
    .map((enlace) => enlace.textContent);
const menu = () => screen.getByRole("button", { name: "Menú" });
const navegacion = () => screen.getByRole("navigation", { name: "Secciones" });

describe("CP-RF-41 · barra inferior de destinos", () => {
  it("el directivo ve a la vista anuncios, supervisión y cursos; lo demás queda bajo «Menú»", () => {
    dibujar("directivo", DIRECTIVO);

    expect(aLaVista()).toEqual(["Anuncios", "Supervisión", "Cursos"]);
    expect(bajoMenu()).toEqual([
      "Horario de disponibilidad",
      "Años lectivos",
      "Docentes",
      "Alumnos y tutores",
    ]);
    expect(menu()).not.toHaveClass("hidden");
  });

  it("el docente ve a la vista anuncios, publicar un anuncio y el canal grupal", () => {
    dibujar("docente", DOCENTE);

    expect(aLaVista()).toEqual([
      "Anuncios",
      "Publicar un anuncio",
      "Canal grupal",
    ]);
    expect(bajoMenu()).toEqual([
      "Constancias",
      "Horario de disponibilidad",
      "Cursos",
      "Alumnos y tutores",
    ]);
  });

  it("el tutor y el alumno ven todo a la vista y no necesitan «Menú»", () => {
    dibujar("tutor", ["anuncios", "conversaciones", "preferencias"]);

    expect(aLaVista()).toEqual([
      "Anuncios",
      "Canal grupal",
      "Horario de disponibilidad",
    ]);
    expect(bajoMenu()).toEqual([]);
    expect(menu()).toHaveClass("hidden");
  });

  it("el alumno, con dos opciones, las ve ambas a la vista", () => {
    dibujar("alumno", ["anuncios", "preferencias"]);

    expect(aLaVista()).toEqual(["Anuncios", "Horario de disponibilidad"]);
    expect(menu()).toHaveClass("hidden");
  });

  it("conserva el orden recibido y no duplica ningún enlace", () => {
    dibujar("docente", DOCENTE);

    expect(todos().map((enlace) => enlace.textContent)).toEqual([
      "Anuncios",
      "Publicar un anuncio",
      "Constancias",
      "Canal grupal",
      "Horario de disponibilidad",
      "Cursos",
      "Alumnos y tutores",
    ]);
  });

  it("no agrega una opción que la interfaz no habilitó", () => {
    dibujar("directivo", ["anuncios"]);

    expect(todos().map((enlace) => enlace.textContent)).toEqual(["Anuncios"]);
  });

  it("si ninguna opción recibida es de uso diario, todas quedan a la vista", () => {
    dibujar("directivo", ["preferencias", "docentes"]);

    expect(aLaVista()).toEqual(["Horario de disponibilidad", "Docentes"]);
    expect(bajoMenu()).toEqual([]);
  });

  it("al abrir «Menú» todos los destinos se ofrecen en una hoja sobre la barra", () => {
    dibujar("directivo", DIRECTIVO);

    fireEvent.click(menu());

    expect(menu()).toHaveAttribute("aria-expanded", "true");
    expect(bajoMenu()).toEqual([]);
    expect(aLaVista()).toHaveLength(7);
    expect(screen.getByRole("list")).toHaveClass("max-md:absolute");
  });

  it("en pantallas angostas la navegación va debajo del contenido", () => {
    dibujar("docente", DOCENTE);

    expect(navegacion()).toHaveClass("max-md:order-last");
  });

  it("Escape cierra la hoja de «Menú»", () => {
    dibujar("docente", DOCENTE);
    fireEvent.click(menu());

    fireEvent.keyDown(document, { key: "Escape" });

    expect(menu()).toHaveAttribute("aria-expanded", "false");
  });

  it("tocar fuera de la hoja la cierra", () => {
    dibujar("docente", DOCENTE);
    fireEvent.click(menu());

    fireEvent.click(document.querySelector(".fixed.inset-0"));

    expect(menu()).toHaveAttribute("aria-expanded", "false");
    expect(document.querySelector(".fixed.inset-0")).toBeNull();
  });

  it("cada destino lleva un ícono decorativo y su nombre escrito", () => {
    dibujar("directivo", DIRECTIVO);

    todos().forEach((enlace) => {
      expect(enlace.querySelector("svg")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      expect(enlace.textContent).not.toBe("");
    });
  });

  it("«Cerrar sesión» conserva su nombre aunque en el teléfono se vea como ícono", () => {
    dibujar("alumno", ["anuncios", "preferencias"]);

    expect(
      screen.getByRole("button", { name: "Cerrar sesión" }),
    ).toBeInTheDocument();
  });
});

const perfil = () => screen.getByRole("button", { name: /^Perfil:/ });
const contenidoDelPerfil = () => document.getElementById("perfil");

describe("CP-RF-41 · perfil en la cabecera del teléfono", () => {
  it.each([
    ["directivo", "Directivo", "escudo"],
    ["docente", "Docente", "libro"],
    ["tutor", "Tutor", "casa"],
    ["alumno", "Alumno", "birrete"],
  ])(
    "el botón de perfil del %s se reconoce por el ícono del rol y nombra persona y rol",
    (rol, etiqueta, icono) => {
      dibujar(rol, ["anuncios"]);

      expect(perfil()).toHaveAccessibleName(`Perfil: Ana · ${etiqueta}`);
      expect(perfil()).toHaveClass("md:hidden", "bg-rol-100", "text-rol-800");
      expect(
        perfil().querySelector("[data-testid='icono-rol']"),
      ).toHaveAttribute("data-icono", icono);
    },
  );

  it("cerrado, el nombre, la instalación y el cierre de sesión no se ven en el teléfono", () => {
    dibujar("tutor", ["anuncios"]);

    expect(perfil()).toHaveAttribute("aria-expanded", "false");
    expect(contenidoDelPerfil()).toHaveClass("max-md:hidden");
    expect(contenidoDelPerfil()).toContainElement(
      screen.getByRole("button", { name: "Cerrar sesión" }),
    );
  });

  it("abierto, despliega el nombre con el rol y el cierre de sesión", () => {
    dibujar("tutor", ["anuncios"]);

    fireEvent.click(perfil());

    expect(perfil()).toHaveAttribute("aria-expanded", "true");
    expect(contenidoDelPerfil()).not.toHaveClass("max-md:hidden");
    expect(contenidoDelPerfil()).toHaveTextContent("Ana · Tutor");
  });

  it("Escape y tocar fuera cierran el perfil", () => {
    dibujar("tutor", ["anuncios"]);

    fireEvent.click(perfil());
    fireEvent.keyDown(document, { key: "Escape" });
    expect(perfil()).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(perfil());
    fireEvent.click(document.querySelector(".fixed.inset-0"));
    expect(perfil()).toHaveAttribute("aria-expanded", "false");
    expect(document.querySelector(".fixed.inset-0")).toBeNull();
  });

  it("abrir el perfil cierra la hoja de «Menú» y al revés", () => {
    dibujar("docente", DOCENTE);

    fireEvent.click(menu());
    fireEvent.click(perfil());
    expect(menu()).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menu());
    expect(perfil()).toHaveAttribute("aria-expanded", "false");
  });
});
