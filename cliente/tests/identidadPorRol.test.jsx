// RF-40 Identidad visual por rol · CU-09 · RN-04, RN-15
// Prueba: CP-RF-40
//
// Para cada rol (directivo, docente, tutor, alumno): el armazón declara data-rol,
// muestra la etiqueta de rol en un chip y un ícono propio con aria-hidden; el
// título, el ítem activo y el botón primario usan clases rol-*; el armazón ya no
// tiene emerald fijo. Además, una prueba que lee los tokens de estilos.css y
// verifica contraste ≥ 4,5:1 de blanco sobre -700 y de -800 sobre -50 en los
// cuatro roles.
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Armazon from "../comun/Armazon.jsx";
import { ContextoSesion } from "../comun/contextoSesion.js";
import { panelDe } from "./ayudas.js";
import fs from "fs";
import path from "path";

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

function dibujar(panel) {
  const valor = { panel, errorPanel: null, cerrar: jest.fn() };
  render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter>
        <Armazon secciones={secciones} />
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
  return valor;
}

const ROLES = [
  { rol: "directivo", etiqueta: "Directivo", icono: "escudo" },
  { rol: "docente", etiqueta: "Docente", icono: "libro" },
  { rol: "tutor", etiqueta: "Tutor", icono: "casa" },
  { rol: "alumno", etiqueta: "Alumno", icono: "birrete" },
];

describe("CP-RF-40 · identidad visual por rol", () => {
  it.each(ROLES)(
    "el armazón del rol %s declara data-rol, muestra chip e ícono",
    ({ rol, etiqueta, icono: icono_ }) => {
      dibujar(panelDe(rol, { opciones_habilitadas: ["anuncios"] }));

      const root = screen.getByTestId("armazon-root");
      expect(root).toHaveAttribute("data-rol", rol);

      const chip = screen.getByText(`Ana · ${etiqueta}`);
      expect(chip).toHaveClass("bg-rol-100", "text-rol-800");
      expect(chip).not.toHaveAttribute("aria-hidden");

      const iconos = screen.getAllByTestId("icono-rol");
      expect(iconos.length).toBeGreaterThanOrEqual(1);
      iconos.forEach((icono) => {
        expect(icono).toHaveAttribute("aria-hidden", "true");
        expect(icono).toHaveAttribute("data-icono", icono_);
      });
    },
  );

  it.each(ROLES)(
    "el título de la cabecera usa clases rol-* (sin emerald fijo) para rol %s",
    ({ rol }) => {
      dibujar(panelDe(rol, { opciones_habilitadas: ["anuncios"] }));

      const titulo = screen.getByText("Plataforma de comunicación escolar");
      const contenedorTitulo = titulo.closest("p");
      expect(contenedorTitulo).toHaveClass("text-rol-800");

      const svgTitulo = contenedorTitulo.querySelector("svg");
      expect(svgTitulo).toHaveAttribute("stroke", "currentColor");
      expect(svgTitulo).toHaveAttribute("aria-hidden", "true");
      expect(contenedorTitulo).not.toHaveClass("text-emerald-800");
    },
  );

  it.each(ROLES)(
    "el ítem de navegación activo usa clases rol-* para rol %s",
    ({ rol }) => {
      dibujar(panelDe(rol, { opciones_habilitadas: ["anuncios"] }));

      const enlaceActivo = screen.getByRole("link", { name: "Anuncios" });
      expect(enlaceActivo).toHaveClass("bg-rol-50");
      expect(enlaceActivo).toHaveClass("text-rol-800");
      expect(enlaceActivo).not.toHaveClass("bg-emerald-50");
      expect(enlaceActivo).not.toHaveClass("text-emerald-800");
    },
  );

  it.each(ROLES)(
    "el botón primario usa clases rol-* para rol %s",
    ({ rol }) => {
      // Usamos un formulario simple para probar el botón primario
      const { render: r } = require("@testing-library/react");
      const { Boton } = require("../comun/formularios.jsx");

      r(
        <ContextoSesion.Provider
          value={{
            panel: panelDe(rol),
            errorPanel: null,
            cerrar: jest.fn(),
          }}
        >
          <MemoryRouter>
            <form>
              <Boton>Enviar</Boton>
            </form>
          </MemoryRouter>
        </ContextoSesion.Provider>,
      );

      const boton = screen.getByRole("button", { name: "Enviar" });
      expect(boton).toHaveClass("bg-rol-700");
      expect(boton).toHaveClass("hover:bg-rol-800");
      expect(boton).toHaveClass("focus-visible:outline-rol-700");
      expect(boton).not.toHaveClass("bg-emerald-700");
      expect(boton).not.toHaveClass("hover:bg-emerald-800");
      expect(boton).not.toHaveClass("focus-visible:outline-emerald-700");
    },
  );

  it("no queda ninguna clase emerald fija en el armazón", () => {
    dibujar(panelDe("tutor", { opciones_habilitadas: ["anuncios"] }));

    const root = screen.getByTestId("armazon-root");
    const html = root.innerHTML;
    expect(html).not.toMatch(/emerald-/);
  });
});

describe("CP-RF-40 · contraste de tokens de color por rol", () => {
  // Función para calcular luminosidad relativa (WCAG 2.1)
  function luminosidadRelativa(hex) {
    const rgb = hex
      .replace("#", "")
      .match(/.{2}/g)
      .map((c) => parseInt(c, 16) / 255);
    const srgb = rgb.map((c) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
    );
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  }

  function contraste(fondo, texto) {
    const L1 = luminosidadRelativa(fondo);
    const L2 = luminosidadRelativa(texto);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  }

  // Leer tokens de estilos.css
  const cssPath = path.resolve(__dirname, "../comun/estilos.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  function extraerToken(prefijo, sufijo) {
    const regex = new RegExp(
      `--color-${prefijo}-${sufijo}:\\s*#([0-9a-fA-F]{6})`,
    );
    const match = css.match(regex);
    return match ? `#${match[1]}` : null;
  }

  const roles = ["directivo", "docente", "tutor", "alumno"];

  it.each(roles)("blanco sobre -700 tiene contraste ≥ 4,5:1 para %s", (rol) => {
    const fondo = extraerToken(rol, "700");
    expect(fondo).not.toBeNull();
    const ratio = contraste(fondo, "#ffffff");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it.each(roles)("-800 sobre -50 tiene contraste ≥ 4,5:1 para %s", (rol) => {
    const texto = extraerToken(rol, "800");
    const fondo = extraerToken(rol, "50");
    expect(texto).not.toBeNull();
    expect(fondo).not.toBeNull();
    const ratio = contraste(fondo, texto);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
