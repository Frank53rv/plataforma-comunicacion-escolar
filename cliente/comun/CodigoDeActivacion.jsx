// RF-03 Alta de docentes · RF-04 · RF-07 Regeneración del código de activación · CU-04, CU-05
// · RN-06
// Prueba: CP-RF-03 · CP-RF-04 · CP-RF-07
//
// Tabla 29 · el código de activación se devuelve en claro una sola vez, en la respuesta de la
// operación que lo genera o lo regenera, y no vuelve a ser recuperable (RN-06, RNF-03): la
// interfaz de programación guarda su derivación. Por eso se presenta hasta que la persona lo
// da por leído y no se guarda en ningún lado.
import { formatearFechaHora } from "./fechas.js";

export default function CodigoDeActivacion({ para, codigo, alCerrar }) {
  return (
    <div
      role="status"
      className="mb-4 max-w-2xl rounded border border-slate-900 bg-slate-50 p-4"
    >
      <p className="font-medium text-slate-900">{`Código de activación de ${para}: ${codigo.codigo}`}</p>
      <p className="mb-3 text-sm text-slate-700">
        {`Vence el ${formatearFechaHora(codigo.vence_en)}. Se muestra una sola vez: entregarlo a la persona.`}
      </p>
      <button
        type="button"
        className="rounded border border-slate-300 px-3 py-1 text-sm"
        onClick={alCerrar}
      >
        Entendido
      </button>
    </div>
  );
}
