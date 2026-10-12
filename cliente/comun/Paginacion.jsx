// RF-22 Consulta del historial de anuncios · CU-09
// Prueba: CP-RF-22
//
// Tabla 28 · colecciones paginadas con `pagina` y `por_pagina`. Sin más de una página no se
// dibuja.
export default function Paginacion({ pagina, porPagina, total, alCambiar }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  if (paginas <= 1) return null;

  const estilo =
    "rounded border border-slate-300 px-3 py-1 disabled:opacity-40";
  return (
    <nav aria-label="Páginas" className="mt-4 flex items-center gap-3 text-sm">
      <button
        type="button"
        className={estilo}
        disabled={pagina <= 1}
        onClick={() => alCambiar(pagina - 1)}
      >
        Anterior
      </button>
      <span>
        Página {pagina} de {paginas}
      </span>
      <button
        type="button"
        className={estilo}
        disabled={pagina >= paginas}
        onClick={() => alCambiar(pagina + 1)}
      >
        Siguiente
      </button>
    </nav>
  );
}
