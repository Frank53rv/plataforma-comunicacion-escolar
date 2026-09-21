// RF-40 Paneles diferenciados por rol · CU-09 · RN-04, RN-15
// Prueba: CP-RF-40
//
// Armazón único de los cuatro paneles: barra superior con la persona, su rol y el cierre de
// sesión; navegación con las opciones que la interfaz de programación habilitó; contenido.
// En 768 px o más la navegación es lateral; por debajo se recoge en un menú. Que la interfaz
// sea operable en los tres anchos de referencia se verifica en la rama de la interfaz
// responsiva, no acá.
import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { useSesion } from "./contextoSesion.js";
import { ETIQUETAS_DE_ROL, SECCIONES } from "./secciones.js";

export default function Armazon({ secciones = SECCIONES }) {
  const { panel, errorPanel, cerrar } = useSesion();
  const [abierto, setAbierto] = useState(false);

  if (!panel) {
    return (
      <p role={errorPanel ? "alert" : "status"} className="p-6 text-slate-700">
        {errorPanel || "Cargando…"}
      </p>
    );
  }

  const opciones = panel.opciones_habilitadas.filter(
    (opcion) => secciones[opcion],
  );

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <p className="font-semibold">Plataforma de comunicación escolar</p>
        <div className="flex items-center gap-3 text-sm">
          <span>
            {panel.nombre} · {ETIQUETAS_DE_ROL[panel.rol]}
          </span>
          <button
            type="button"
            onClick={cerrar}
            className="rounded border border-slate-300 px-3 py-1"
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <div className="md:flex">
        <nav
          aria-label="Secciones"
          className="border-b border-slate-200 p-4 md:w-56 md:border-r md:border-b-0"
        >
          <button
            type="button"
            aria-expanded={abierto}
            onClick={() => setAbierto(!abierto)}
            className="rounded border border-slate-300 px-3 py-1 md:hidden"
          >
            Menú
          </button>
          <ul
            className={`${abierto ? "mt-3 block" : "hidden"} space-y-1 md:mt-0 md:block`}
          >
            {opciones.map((opcion) => (
              <li key={opcion}>
                <NavLink
                  to={secciones[opcion].ruta}
                  end
                  onClick={() => setAbierto(false)}
                  className={({ isActive }) =>
                    `block rounded px-3 py-2 ${isActive ? "bg-slate-900 text-white" : "text-slate-800"}`
                  }
                >
                  {secciones[opcion].etiqueta}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <main className="min-w-0 flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
