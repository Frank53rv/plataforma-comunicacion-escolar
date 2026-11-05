// RF-40 Paneles diferenciados por rol · CU-09 · RN-04, RN-15
// Prueba: CP-RF-40
//
// RF-40 (Tabla 10) · cada rol ve su panel «sin exponer opciones ajenas»: una dirección
// escrita a mano, que el menú no ofrece, no abre la pantalla de otro rol.
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Aplicacion from "../comun/Aplicacion.jsx";
import { panelDe, sesionGuardada, simularApi } from "./ayudas.js";

function abrir(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Aplicacion />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  sesionGuardada();
});

describe("CP-RF-40 · direcciones de otro rol", () => {
  it.each([
    ["/publicar", "Publicar un anuncio"],
    ["/anios-lectivos", "Años lectivos"],
    ["/docentes", "Docentes"],
    ["/supervision", "Supervisión"],
    ["/constancias", "Constancias"],
    ["/anuncios/a1/constancias", "Constancia de lectura"],
  ])("el tutor que escribe %s vuelve a su bandeja", async (ruta, titulo) => {
    simularApi({
      "GET /paneles/me": [200, panelDe("tutor")],
      "GET /anuncios?pagina=1&por_pagina=25": [
        200,
        { datos: [], total: 0, pagina: 1, por_pagina: 25 },
      ],
    });
    abrir(ruta);

    expect(
      await screen.findByRole("heading", { name: "Anuncios" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: titulo }),
    ).not.toBeInTheDocument();
  });

  it("el docente conserva el acceso a la pantalla que su panel habilita", async () => {
    simularApi({
      "GET /paneles/me": [
        200,
        panelDe("docente", {
          opciones_habilitadas: ["anuncios", "publicar_anuncio"],
        }),
      ],
    });
    abrir("/publicar");

    expect(
      await screen.findByRole("heading", { name: "Publicar un anuncio" }),
    ).toBeInTheDocument();
  });
});
