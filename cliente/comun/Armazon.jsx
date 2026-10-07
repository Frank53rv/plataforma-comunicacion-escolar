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
import {
  DESTINOS_A_LA_VISTA,
  ETIQUETAS_DE_ROL,
  SECCIONES,
} from "./secciones.js";

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
  const diarios = (DESTINOS_A_LA_VISTA[panel.rol] ?? opciones).filter(
    (opcion) => opciones.includes(opcion),
  );
  const aLaVista = diarios.length > 0 ? diarios : opciones;
  const hayDesborde = aLaVista.length < opciones.length;
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
          className={`relative shrink-0 border-slate-200 bg-white p-2 max-md:order-last max-md:flex max-md:items-center max-md:gap-2 max-md:border-t md:w-56 md:overflow-y-auto md:border-r ${ocultoEnCanal}`}
        >
          <ul
            className={
              abierto
                ? "max-md:absolute max-md:inset-x-0 max-md:bottom-full max-md:z-10 max-md:max-h-[60dvh] max-md:space-y-1 max-md:overflow-y-auto max-md:border-t max-md:border-slate-200 max-md:bg-white max-md:p-2 max-md:shadow-lg md:space-y-1"
                : "flex min-w-0 flex-1 gap-1 md:block md:space-y-1"
            }
          >
            {opciones.map((opcion) => (
              <li
                key={opcion}
                className={
                  abierto
                    ? ""
                    : `min-w-0 max-md:flex-1 ${aLaVista.includes(opcion) ? "" : "max-md:hidden"}`
                }
              >
                <NavLink
                  to={secciones[opcion].ruta}
                  end={secciones[opcion].ruta === "/"}
                  onClick={() => setAbierto(false)}
                  className={({ isActive }) =>
                    `block rounded-full px-4 py-2 focus-visible:outline-2 focus-visible:outline-rol-700 ${abierto ? "" : "max-md:px-1 max-md:text-center max-md:text-sm max-md:leading-tight"} ${isActive ? "bg-rol-50 font-semibold text-rol-800" : "text-slate-700 hover:bg-slate-100"}`
                  }
                >
                  {secciones[opcion].etiqueta}
                </NavLink>
              </li>
            ))}
          </ul>
          <button
            type="button"
            aria-expanded={abierto}
            onClick={() => setAbierto(!abierto)}
            className={`flex shrink-0 items-center gap-2 rounded-full border border-slate-500 px-3 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rol-700 md:hidden ${hayDesborde ? "" : "hidden"}`}
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
