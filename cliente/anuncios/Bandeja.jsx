// RF-40 Paneles diferenciados por rol · CU-09 · RN-15
// Prueba: CP-RF-40
//
// Vista de entrada de los cuatro paneles. Presenta el panel del rol; el historial con sus
// filtros y el detalle son de la rama de la bandeja.
import { useSesion } from "../comun/contextoSesion.js";

export default function Bandeja() {
  const { panel } = useSesion();
  return (
    <section>
      <h2 className="mb-2 text-xl font-semibold text-slate-900">Anuncios</h2>
      <p className="text-sm text-slate-700">
        Anuncios sin leer: {panel.anuncios_sin_leer}
      </p>
    </section>
  );
}
