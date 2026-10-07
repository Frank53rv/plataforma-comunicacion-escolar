// RF-40 Paneles diferenciados por rol · RF-41 Interfaz responsiva · CU-09 · RN-04, RN-15
// Prueba: CP-RF-40 · CP-RF-41
//
// Armazón único de los cuatro paneles: barra superior con el rol, la persona y el cierre de
// sesión; navegación con las opciones que la interfaz de programación habilitó; contenido.
// Ocupa el alto de la ventana y sólo desplaza el contenido. En 768 px o más la navegación es
// lateral. Por debajo es una barra inferior con los destinos de uso diario del rol, cada uno
// con su ícono y su nombre; el resto se ofrece en una hoja que abre «Menú» y que se cierra con
// el mismo botón, con Escape o tocando fuera de ella. La cabecera se reduce a una fila. Dentro
// de un canal grupal, por debajo del ancho grande, cabecera y navegación se ocultan con un
// punto de corte para que el canal ocupe la pantalla: siguen en el documento y el canal ofrece
// la vuelta.
import { useEffect, useState } from "react";
import { NavLink, Outlet, useMatch } from "react-router";
import BotonDeInstalacion from "./BotonDeInstalacion.jsx";
import IconoDeRol from "./IconoDeRol.jsx";
import IconoDeSeccion from "./IconoDeSeccion.jsx";
import { useSesion } from "./contextoSesion.js";
import {
  DESTINOS_A_LA_VISTA,
  ETIQUETAS_DE_ROL,
  SECCIONES,
} from "./secciones.js";

const FOCO =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rol-700";

export default function Armazon({ secciones = SECCIONES }) {
  const { panel, errorPanel, cerrar } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const enCanal = useMatch("/conversaciones/:id") !== null;

  useEffect(() => {
    if (!abierto) return undefined;
    const alPresionar = (evento) => {
      if (evento.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", alPresionar);
    return () => document.removeEventListener("keydown", alPresionar);
  }, [abierto]);

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
      data-rol={panel.rol}
      className="flex h-dvh flex-col bg-stone-50 text-slate-900 [overflow-wrap:anywhere]"
    >
      <header
        className={`flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2 ${ocultoEnCanal}`}
      >
        <p className="flex min-w-0 items-center gap-2 font-semibold text-rol-800">
          <IconoDeRol rol={panel.rol} className="size-7 shrink-0" />
          <span className="max-md:sr-only">
            Plataforma de comunicación escolar
          </span>
        </p>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 text-sm">
          <span className="rounded-full border border-rol-200 bg-rol-100 px-3 py-1 font-medium text-rol-800">
            {panel.nombre} · {rolEtiqueta}
          </span>
          <BotonDeInstalacion />
          <button
            type="button"
            onClick={cerrar}
            className={`flex min-h-9 items-center rounded-full border border-slate-500 px-3 py-1 hover:bg-slate-100 max-sm:min-w-9 max-sm:px-2 ${FOCO}`}
          >
            <IconoDeSeccion seccion="salir" className="size-5 sm:hidden" />
            <span className="max-sm:sr-only">Cerrar sesión</span>
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {abierto && (
          <div
            aria-hidden="true"
            onClick={() => setAbierto(false)}
            className="fixed inset-0 z-20 bg-slate-900/40 md:hidden"
          />
        )}
        <nav
          aria-label="Secciones"
          className={`relative z-30 shrink-0 border-slate-200 bg-white p-2 max-md:order-last max-md:flex max-md:items-stretch max-md:gap-1 max-md:border-t max-md:px-1 max-md:pt-1 max-md:pb-[max(0.25rem,env(safe-area-inset-bottom))] md:w-60 md:overflow-y-auto md:border-r ${ocultoEnCanal}`}
        >
          <ul
            className={
              abierto
                ? "max-md:absolute max-md:inset-x-0 max-md:bottom-full max-md:max-h-[70dvh] max-md:space-y-1 max-md:overflow-y-auto max-md:rounded-t-2xl max-md:bg-white max-md:p-3 max-md:shadow-lg md:space-y-1"
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
                    `flex items-center gap-3 rounded-full px-4 py-2 ${FOCO} ${abierto ? "max-md:min-h-12 max-md:text-base" : "max-md:min-h-14 max-md:flex-col max-md:justify-start max-md:gap-1 max-md:pt-2 max-md:rounded-2xl max-md:px-1 max-md:py-1 max-md:text-center max-md:text-xs max-md:leading-tight max-md:[overflow-wrap:normal]"} ${isActive ? "bg-rol-50 font-semibold text-rol-800" : "text-slate-700 hover:bg-slate-100"}`
                  }
                >
                  <IconoDeSeccion seccion={opcion} />
                  <span>{secciones[opcion].etiqueta}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          <button
            type="button"
            aria-expanded={abierto}
            onClick={() => setAbierto(!abierto)}
            className={`flex min-h-14 shrink-0 flex-col items-center justify-start gap-1 rounded-2xl px-3 pt-2 pb-1 text-xs text-slate-700 hover:bg-slate-100 md:hidden ${abierto ? "ml-auto bg-slate-100" : ""} ${FOCO} ${hayDesborde ? "" : "hidden"}`}
          >
            <IconoDeSeccion seccion={abierto ? "cerrar" : "menu"} />
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
