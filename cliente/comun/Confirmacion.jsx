// RNF-14 Protección frente a errores del usuario · CU-04, CU-05, CU-08
// Prueba: CP-RNF-14
//
// RNF-14 (Tabla 11) · «Toda acción destructiva —baja de persona, eliminación de anuncio—
// exige confirmación explícita.» Nada se pide antes de que la persona confirme.
export default function Confirmacion({
  etiqueta,
  texto,
  confirmar,
  cancelar = "Cancelar",
  alConfirmar,
  alCancelar,
  ocupado = false,
  deshabilitarConfirmar = false,
  children,
}) {
  return (
    <div
      role="alertdialog"
      aria-label={etiqueta}
      className="mt-3 max-w-2xl rounded border border-red-300 bg-red-50 p-3"
    >
      <p className="mb-3 text-sm text-red-900">{texto}</p>
      {children}
      <div className="flex gap-3">
        <button
          type="button"
          disabled={ocupado || deshabilitarConfirmar}
          onClick={alConfirmar}
          className="rounded bg-red-700 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          {confirmar}
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={alCancelar}
          className="rounded border border-slate-300 px-3 py-1 text-sm"
        >
          {cancelar}
        </button>
      </div>
    </div>
  );
}
