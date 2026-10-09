// RF-31 Notificación de anuncios · CU-06, CU-14 · RN-18
// Prueba: CP-RF-31
//
// Tabla 23 · la instalación del cliente es la condición de la recepción del aviso push en
// iOS (riesgo R-03). El botón la ofrece desde la barra del armazón mientras el navegador la
// admita; instalada la aplicación, desaparece. En iOS no hay ofrecimiento que invocar —
// Safari no emite `beforeinstallprompt`—, así que se indica la vía del menú de compartir.
import { useEffect, useState } from "react";
import {
  esIOS,
  escucharInstalacion,
  estaInstalada,
  navegadorDeIOS,
} from "./instalacion.js";

const GUIAS = {
  safari:
    "Para instalarla, tocá Compartir (el cuadrado con la flecha hacia arriba), deslizá hacia abajo y elegí «Agregar a pantalla de inicio». Si no aparece, tocá «Editar acciones» al final de la lista y agregala.",
  otro: "Para instalarla, abrí esta página en Safari: tocá Compartir y elegí «Agregar a pantalla de inicio». Desde otros navegadores o desde el navegador de otra aplicación puede no estar esa opción.",
};

export default function BotonDeInstalacion() {
  const [oferta, setOferta] = useState(null);
  const [instalada, setInstalada] = useState(() => estaInstalada());
  const [guia, setGuia] = useState(false);

  useEffect(
    () =>
      escucharInstalacion({
        alOfrecer: setOferta,
        alInstalar: () => setInstalada(true),
      }),
    [],
  );

  if (instalada || (!oferta && !esIOS())) return null;

  async function instalar() {
    if (!oferta) return setGuia(!guia);
    setOferta(null);
    await oferta.prompt();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={instalar}
        aria-expanded={oferta ? undefined : guia}
        className="flex min-h-9 items-center gap-1 rounded-full border border-slate-500 px-3 py-1 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rol-700 max-sm:min-w-9 max-sm:px-2"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5 shrink-0 sm:hidden"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
        </svg>
        <span className="max-sm:sr-only">Instalar aplicación</span>
      </button>
      {guia && (
        <p
          role="status"
          className="absolute right-0 z-40 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 shadow-lg"
        >
          {GUIAS[navegadorDeIOS()]} Sin instalarla, los avisos se presentan
          dentro de la aplicación.
        </p>
      )}
    </div>
  );
}
