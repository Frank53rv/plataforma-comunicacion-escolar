// RF-25 Canal grupal del curso · RF-29 · CU-12 · RN-23
// Prueba: CP-RF-25 · CP-RF-29
//
// Presentación de la lista de canales grupales como filas táctiles: avatar con las iniciales
// del curso, el título como enlace estirado sobre la fila y el último mensaje limitado a una
// línea sin impedir el corte del texto (RNF-18: nada de `whitespace-nowrap`). El canal de un
// curso se presenta como una tarjeta con su estado y la acción de abrirlo.
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import CanalesDelCurso from "../conversacion/CanalesDelCurso.jsx";
import Conversaciones from "../conversacion/Conversaciones.jsx";
import { crearApi } from "../comun/api.js";
import { ContextoSesion } from "../comun/contextoSesion.js";
import { panelDe, simularApi } from "./ayudas.js";

const canal = (extra = {}) => ({
  id: "k1",
  curso_id: "c1",
  tipo: "grupal_de_tutores",
  estado: "activa",
  ultimo_mensaje: {
    id: "m9",
    cuerpo: "Hasta mañana",
    enviado_en: "2026-03-02T15:30:00Z",
    autor: { id: "ot", nombre: "Marta", apellido: "Ruiz", rol: "tutor" },
  },
  ...extra,
});

function dibujar(ruta) {
  const valor = {
    panel: panelDe("tutor", { cursos: [{ id: "c1", nombre: "Primero A" }] }),
    sesion: { usuario_id: "yo", token: "tok" },
    api: crearApi({ obtenerToken: () => "tok" }),
  };
  return render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/conversaciones" element={<Conversaciones />} />
          <Route path="/cursos/:id/canal" element={<CanalesDelCurso />} />
        </Routes>
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
}

const coleccion = (datos) => [
  200,
  { datos, total: datos.length, pagina: 1, por_pagina: 25 },
];

describe("CP-RF-25 · la lista de canales como filas táctiles", () => {
  it("el enlace del canal se estira sobre la fila", async () => {
    simularApi({
      "GET /conversaciones?pagina=1&por_pagina=25": coleccion([canal()]),
    });
    dibujar("/conversaciones");

    const enlace = await screen.findByRole("link", { name: /Primero A/ });
    expect(enlace).toHaveClass("after:absolute", "after:inset-0");
    expect(enlace.closest("li")).toHaveClass("relative");
  });

  it("el último mensaje ocupa una línea y puede cortarse", async () => {
    simularApi({
      "GET /conversaciones?pagina=1&por_pagina=25": coleccion([canal()]),
    });
    dibujar("/conversaciones");

    const previa = await screen.findByText(/Marta Ruiz: Hasta mañana/);
    const renglon = previa.closest("p");
    expect(renglon).toHaveClass("line-clamp-1", "break-words");
    expect(renglon).not.toHaveClass("whitespace-nowrap");
  });

  it("el canal se identifica con las iniciales del curso", async () => {
    simularApi({
      "GET /conversaciones?pagina=1&por_pagina=25": coleccion([canal()]),
    });
    dibujar("/conversaciones");

    expect(await screen.findByText("PA")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("un canal de un curso ajeno al panel conserva un avatar y el título genérico", async () => {
    simularApi({
      "GET /conversaciones?pagina=1&por_pagina=25": coleccion([
        canal({ curso_id: "otro", ultimo_mensaje: null }),
      ]),
    });
    dibujar("/conversaciones");

    expect(
      await screen.findByRole("link", { name: "Canal grupal" }),
    ).toBeInTheDocument();
    expect(screen.getByText("CG")).toBeInTheDocument();
  });
});

describe("CP-RF-25 · el canal de un curso como tarjeta", () => {
  it("presenta el estado como etiqueta y la acción de abrir como botón", async () => {
    simularApi({ "GET /cursos/c1/conversaciones": coleccion([canal()]) });
    dibujar("/cursos/c1/canal");

    expect(await screen.findByText("Activo")).toHaveClass("rounded-full");
    expect(
      screen.getByRole("link", { name: "Abrir el canal grupal" }),
    ).toHaveClass("bg-rol-700");
  });
});
