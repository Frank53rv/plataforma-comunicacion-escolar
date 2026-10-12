// RF-39 Bandeja de anuncios como vista de entrada · RF-22 · CU-09, CU-10 · RN-15
// Prueba: CP-RF-39 · CP-RF-22
//
// Presentación de la bandeja como filas táctiles y del detalle como lectura. Toda la fila
// lleva al detalle, pero el enlace conserva como nombre accesible sólo el título: la fila se
// vuelve táctil con un enlace estirado, no envolviendo autor y fecha dentro del enlace. El
// autor se identifica con un avatar de iniciales decorativo, al lado de su nombre.
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import Bandeja from "../anuncios/Bandeja.jsx";
import Detalle from "../anuncios/Detalle.jsx";
import { crearApi } from "../comun/api.js";
import { ContextoSesion } from "../comun/contextoSesion.js";
import { panelDe, simularApi } from "./ayudas.js";

const autor = { id: "d1", nombre: "Ana", apellido: "Gómez", rol: "docente" };
const fila = (n, extra = {}) => ({
  id: `a${n}`,
  anuncio_version_id: `v${n}`,
  titulo: `Anuncio ${n}`,
  publicado_en: "2026-03-02T15:30:00Z",
  autor,
  leido: false,
  ...extra,
});

function dibujar(entrada, rol = "tutor") {
  const valor = {
    panel: panelDe(rol, { cursos: [{ id: "c1", nombre: "Primero A" }] }),
    sesion: { usuario_id: "otro", token: "tok" },
    api: crearApi({ obtenerToken: () => "tok" }),
  };
  return render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter initialEntries={[entrada]}>
        <Routes>
          <Route path="/" element={<Bandeja />} />
          <Route path="/anuncios/:id" element={<Detalle />} />
        </Routes>
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
}

beforeEach(() => {
  delete global.IntersectionObserver;
});

describe("CP-RF-39 · la bandeja como filas táctiles", () => {
  beforeEach(() => {
    simularApi({
      "GET /anuncios?pagina=1&por_pagina=25": [
        200,
        {
          datos: [fila(1), fila(2, { leido: true })],
          total: 2,
          pagina: 1,
          por_pagina: 25,
        },
      ],
      "POST /entregas/acuses": [200, {}],
    });
  });

  it("el enlace de cada fila se estira sobre la fila y su nombre es sólo el título", async () => {
    dibujar("/");

    const enlace = await screen.findByRole("link", { name: "Anuncio 1" });
    expect(enlace).toHaveClass("after:absolute", "after:inset-0");
    expect(enlace.closest("li")).toHaveClass("relative");
  });

  it("cada fila identifica al autor con sus iniciales, ocultas a los lectores de pantalla", async () => {
    dibujar("/");
    await screen.findByRole("link", { name: "Anuncio 1" });

    const [primera] = within(screen.getByRole("list")).getAllByRole("listitem");
    const avatar = within(primera).getByText("AG");
    expect(avatar).toHaveAttribute("aria-hidden", "true");
  });

  it("el título de un anuncio sin leer se destaca además de llevar la marca en texto", async () => {
    dibujar("/");

    const sinLeer = await screen.findByRole("link", { name: "Anuncio 1" });
    const leido = screen.getByRole("link", { name: "Anuncio 2" });
    expect(sinLeer).toHaveClass("font-semibold");
    expect(leido).not.toHaveClass("font-semibold");
    expect(
      within(sinLeer.closest("li")).getByText("Sin leer"),
    ).toBeInTheDocument();
  });

  it("los filtros siguen a la vista, sin un paso extra para abrirlos (RNF-16)", async () => {
    dibujar("/");
    await screen.findByRole("link", { name: "Anuncio 1" });

    expect(
      screen.getByRole("form", { name: "Filtrar el historial" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Curso")).toBeVisible();
  });
});

describe("CP-RF-22 · el detalle como lectura", () => {
  const anuncio = {
    id: "a1",
    autor_id: "d1",
    estado: "publicado",
    version: {
      id: "v1",
      titulo: "Reunión de padres",
      cuerpo: "Será el viernes.",
      publicado_en: "2026-03-02T15:30:00Z",
    },
    cursos: [{ id: "c1", nombre: "Primero A" }],
  };

  it("llegado desde la bandeja, identifica al autor con sus iniciales", async () => {
    simularApi({
      "GET /anuncios/a1": [200, anuncio],
      "POST /entregas/lecturas": [200, {}],
    });
    dibujar({ pathname: "/anuncios/a1", state: { autor } });

    await screen.findByRole("heading", { name: "Reunión de padres" });
    expect(screen.getByText("AG")).toHaveAttribute("aria-hidden", "true");
  });

  it("abierto directamente no inventa un avatar para un autor que no conoce", async () => {
    simularApi({
      "GET /anuncios/a1": [200, anuncio],
      "POST /entregas/lecturas": [200, {}],
    });
    dibujar("/anuncios/a1");

    await screen.findByRole("heading", { name: "Reunión de padres" });
    expect(screen.queryByText("AG")).not.toBeInTheDocument();
  });
});
