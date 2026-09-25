// RF-31 Notificación de anuncios · CU-06, CU-14 · RN-18
// Prueba: CP-RF-31
//
// Tabla 34 · la instalación del cliente es la condición de la recepción del aviso push en
// iOS (riesgo R-03). El botón la ofrece desde la barra del armazón mientras el navegador la
// admita; instalada la aplicación, desaparece. En iOS no hay ofrecimiento que invocar —
// Safari no emite `beforeinstallprompt`—, así que se indica la vía del menú de compartir.
import { useEffect, useState } from "react";
import { esIOS, escucharInstalacion, estaInstalada } from "./instalacion.js";

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
        className="rounded border border-slate-300 px-3 py-1"
      >
        Instalar aplicación
      </button>
      {guia && (
        <p
          role="status"
          className="absolute right-0 z-10 mt-1 w-64 rounded border border-slate-200 bg-white p-3 text-slate-700 shadow"
        >
          Para instalarla, abrí el menú Compartir del navegador y elegí «Agregar
          a pantalla de inicio». Sin instalarla, los avisos se presentan dentro
          de la aplicación.
        </p>
      )}
    </div>
  );
}
