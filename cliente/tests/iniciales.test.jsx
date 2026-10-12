// RF-25 Canal grupal del curso · RF-39 · CU-12, CU-09 · RN-23
// Prueba: CP-RF-25 · CP-RF-39
//
// Avatar de iniciales: un círculo con las iniciales del nombre que la interfaz de
// programación ya devuelve. No hay fotos de perfil (no hay almacenamiento de archivos en el
// stack). Es decorativo: el nombre se presenta siempre como texto al lado.
import { render } from "@testing-library/react";
import Iniciales from "../comun/Iniciales.jsx";

const dibujar = (props) =>
  render(<Iniciales {...props} />).container.firstChild;

describe("CP-RF-25 · avatar de iniciales", () => {
  it("toma la inicial del primer y del último término del nombre", () => {
    expect(dibujar({ nombre: "Marta Ruiz", semilla: "ot" })).toHaveTextContent(
      /^MR$/,
    );
    expect(dibujar({ nombre: "Primero A", semilla: "c1" })).toHaveTextContent(
      /^PA$/,
    );
    expect(
      dibujar({ nombre: "Ana María  Gómez Paz", semilla: "x" }),
    ).toHaveTextContent(/^AP$/);
  });

  it("un nombre de una sola palabra da una sola inicial, en mayúscula", () => {
    expect(dibujar({ nombre: "ñandutí", semilla: "x" })).toHaveTextContent(
      /^Ñ$/,
    );
  });

  it("sin nombre no inventa iniciales", () => {
    expect(dibujar({ nombre: "", semilla: "x" })).toHaveTextContent(/^$/);
  });

  it("es decorativo: los lectores de pantalla lo omiten", () => {
    expect(dibujar({ nombre: "Marta Ruiz", semilla: "ot" })).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("la misma semilla da siempre el mismo color, y semillas distintas pueden diferir", () => {
    const a = dibujar({ nombre: "Marta Ruiz", semilla: "ot" }).className;
    const b = dibujar({ nombre: "Otra Persona", semilla: "ot" }).className;
    expect(a).toBe(b);

    const colores = new Set(
      ["a", "b", "c", "d", "e", "f", "g", "h"].map((semilla) =>
        dibujar({ nombre: "X", semilla })
          .className.split(" ")
          .find((c) => c.startsWith("bg-")),
      ),
    );
    expect(colores.size).toBeGreaterThan(1);
    colores.forEach((color) => expect(color).toMatch(/-700$/));
  });

  it("admite un tamaño chico para acompañar una burbuja", () => {
    expect(
      dibujar({ nombre: "Marta Ruiz", semilla: "ot", chico: true }),
    ).toHaveClass("size-8");
    expect(dibujar({ nombre: "Marta Ruiz", semilla: "ot" })).toHaveClass(
      "size-10",
    );
  });
});
