import { render, screen } from "@testing-library/react";
import Aplicacion from "../comun/Aplicacion.jsx";

test("el cliente monta y presenta el nombre de la plataforma", () => {
  render(<Aplicacion />);
  expect(screen.getByRole("heading")).toHaveTextContent(
    "Plataforma de comunicación escolar"
  );
});
