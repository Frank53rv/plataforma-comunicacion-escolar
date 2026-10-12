// RF-40 Paneles diferenciados por rol · RF-01 Autenticación · CU-09, CU-01 · RN-04
// Prueba: CP-RF-40 · CP-RF-01
//
// Piezas de formulario comunes. Toda entrada conserva su etiqueta asociada aunque la etiqueta
// quede visible sólo para los lectores de pantalla, y todo error se anuncia como alerta.
import { fireEvent, render, screen } from "@testing-library/react";
import {
  Alerta,
  AreaDeTexto,
  Boton,
  Campo,
  PantallaDeAcceso,
  Selector,
} from "../comun/formularios.jsx";

describe("CP-RF-40 · piezas de formulario", () => {
  it("el área de texto con etiqueta oculta conserva la etiqueta asociada", () => {
    const alCambiar = jest.fn();
    render(
      <AreaDeTexto
        etiqueta="Mensaje"
        valor=""
        alCambiar={alCambiar}
        filas={1}
        etiquetaOculta
      />,
    );

    const area = screen.getByLabelText("Mensaje");
    expect(area.tagName).toBe("TEXTAREA");
    expect(screen.getByText("Mensaje")).toHaveClass("sr-only");
    fireEvent.change(area, { target: { value: "Hola" } });
    expect(alCambiar).toHaveBeenCalledWith("Hola");
  });

  it("sin etiqueta oculta la etiqueta se ve", () => {
    render(<AreaDeTexto etiqueta="Cuerpo" valor="" alCambiar={() => {}} />);

    expect(screen.getByText("Cuerpo")).not.toHaveClass("sr-only");
  });

  it("el área de texto deja pasar el manejo de teclas a quien la usa", () => {
    const alPresionar = jest.fn();
    render(
      <AreaDeTexto
        etiqueta="Mensaje"
        valor=""
        alCambiar={() => {}}
        alPresionarTecla={alPresionar}
      />,
    );

    fireEvent.keyDown(screen.getByLabelText("Mensaje"), { key: "Enter" });
    expect(alPresionar).toHaveBeenCalled();
  });

  it("campo y selector llevan su etiqueta", () => {
    render(
      <>
        <Campo etiqueta="Correo" valor="" alCambiar={() => {}} />
        <Selector
          etiqueta="Curso"
          valor=""
          alCambiar={() => {}}
          opciones={[{ valor: "", etiqueta: "Todos" }]}
        />
      </>,
    );

    expect(screen.getByLabelText("Correo")).toBeInTheDocument();
    expect(screen.getByLabelText("Curso")).toBeInTheDocument();
  });

  it("el botón deshabilitado no envía", () => {
    const enviar = jest.fn((evento) => evento.preventDefault());
    render(
      <form onSubmit={enviar}>
        <Boton disabled>Enviar</Boton>
      </form>,
    );

    expect(screen.getByRole("button", { name: "Enviar" })).toBeDisabled();
  });

  it("un error se anuncia como alerta y sin error no hay nada", () => {
    const { rerender } = render(<Alerta mensaje="Algo falló." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Algo falló.");

    rerender(<Alerta mensaje={null} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("la pantalla de acceso tiene un único encabezado principal y el título", () => {
    render(
      <PantallaDeAcceso titulo="Ingresar">
        <p>contenido</p>
      </PantallaDeAcceso>,
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 2, name: "Ingresar" }),
    ).toBeInTheDocument();
  });
});
