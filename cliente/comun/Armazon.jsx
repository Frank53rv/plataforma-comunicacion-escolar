// RF-40 Paneles diferenciados por rol · RF-41 Interfaz responsiva · CU-09 · RN-04, RN-15
// Prueba: CP-RF-40 · CP-RF-41
//
// Armazón único de los cuatro paneles: barra superior con la persona, su rol y el cierre de
// sesión; navegación con las opciones que la interfaz de programación habilitó; contenido.
// Ocupa el alto de la ventana y sólo desplaza el contenido. En 768 px o más la navegación es
// lateral; por debajo se recoge en un menú. Dentro de un canal grupal, por debajo del ancho
// grande, cabecera y navegación se ocultan con un punto de corte para que el canal ocupe la
// pantalla: siguen en el documento y el canal ofrece la vuelta. Que la interfaz sea operable
// en los tres anchos de referencia se verifica en la rama de la interfaz responsiva, no acá.
import { useState } from "react";
import { NavLink, Outlet, useMatch } from "react-router";
import BotonDeInstalacion from "./BotonDeInstalacion.jsx";
import IconoDeRol from "./IconoDeRol.jsx";
import { useSesion } from "./contextoSesion.js";
import { ETIQUETAS_DE_ROL, SECCIONES } from "./secciones.js";

export default function Armazon({ secciones = SECCIONES }) {
  const { panel, errorPanel, cerrar } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const enCanal = useMatch("/conversaciones/:id") !== null;

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
  const ocultoEnCanal = enCanal ? "max-lg:hidden" : "";
  const rolEtiqueta = ETIQUETAS_DE_ROL[panel.rol];

  return (
    <div
      data-testid="armazon-root"
      data-rol={panel.rol}
      className="flex h-dvh flex-col bg-stone-50 text-slate-900 [overflow-wrap:anywhere]"
    >
      <header
        className={`flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2 ${ocultoEnCanal}`}
      >
        <p className="flex items-center gap-2 font-semibold text-rol-800">
          <IconoDeRol rol={panel.rol} className="size-6" />
          Plataforma de comunicación escolar
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full border border-rol-200 bg-rol-100 px-3 py-1 font-medium text-rol-800">
            {panel.nombre} · {rolEtiqueta}
          </span>
          <BotonDeInstalacion />
          <button
            type="button"
            onClick={cerrar}
            className="rounded-full border border-slate-500 px-3 py-1 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rol-700"
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <nav
          aria-label="Secciones"
          className={`shrink-0 border-b border-slate-200 bg-white p-2 md:w-56 md:overflow-y-auto md:border-r md:border-b-0 ${ocultoEnCanal}`}
        >
          <button
            type="button"
            aria-expanded={abierto}
            onClick={() => setAbierto(!abierto)}
            className="flex items-center gap-2 rounded-full border border-slate-500 px-3 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rol-700 md:hidden"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-4 stroke-current"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Menú
          </button>
          <ul
            className={`${abierto ? "mt-2 block" : "hidden"} max-h-[60dvh] space-y-1 overflow-y-auto md:mt-0 md:block md:max-h-none md:overflow-visible`}
          >
            {opciones.map((opcion) => (
              <li key={opcion}>
                <NavLink
                  to={secciones[opcion].ruta}
                  end={secciones[opcion].ruta === "/"}
                  onClick={() => setAbierto(false)}
                  className={({ isActive }) =>
                    `block rounded-full px-4 py-2 focus-visible:outline-2 focus-visible:outline-rol-700 ${isActive ? "bg-rol-50 font-semibold text-rol-800" : "text-slate-700 hover:bg-slate-100"}`
                  }
                >
                  {secciones[opcion].etiqueta}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <main
          className={`min-w-0 flex-1 min-h-0 overflow-x-hidden overflow-y-auto ${enCanal ? "" : "p-4 md:p-6"}`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
