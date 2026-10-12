// RF-23 Constancias de lectura · CU-11 · RN-21
// Prueba: CP-RF-23
//
// Los anuncios que la persona publicó, para llegar a la constancia de cada uno. Se piden a la
// misma operación del historial, filtrada por remitente: la interfaz de programación no tiene
// una consulta propia y el cliente no la inventa.
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { mensajeDeError } from "../../comun/api.js";
import { useSesion } from "../../comun/contextoSesion.js";
import { formatearFechaHora } from "../../comun/fechas.js";
import Paginacion from "../../comun/Paginacion.jsx";

const POR_PAGINA = 25;

export default function ListadoDeConstancias() {
  const { sesion, api } = useSesion();
  const [pagina, setPagina] = useState(1);
  const [respuesta, setRespuesta] = useState(null);

  useEffect(() => {
    let vigente = true;
    api
      .get(
        `/anuncios?remitente_id=${sesion.usuario_id}&pagina=${pagina}&por_pagina=${POR_PAGINA}`,
      )
      .then((datos) => vigente && setRespuesta({ pagina, ...datos }))
      .catch(
        (error) =>
          vigente && setRespuesta({ pagina, error: mensajeDeError(error) }),
      );
    return () => {
      vigente = false;
    };
  }, [api, sesion.usuario_id, pagina]);

  if (respuesta?.pagina !== pagina) return <p role="status">Cargando…</p>;

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Constancias</h2>
      {respuesta.error && (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {respuesta.error}
        </p>
      )}
      {respuesta.datos?.length === 0 && (
        <p className="text-slate-700">Todavía no publicó ningún anuncio.</p>
      )}
      {respuesta.datos?.length > 0 && (
        <ul className="divide-y divide-slate-200 border-y border-slate-200">
          {respuesta.datos.map((fila) => (
            <li
              key={fila.id}
              className="flex flex-wrap items-baseline justify-between gap-x-4 py-3"
            >
              <div className="min-w-0">
                <span className="font-medium text-slate-900">
                  {fila.titulo}
                </span>
                <p className="text-sm text-slate-600">
                  {formatearFechaHora(fila.publicado_en)}
                </p>
              </div>
              <Link
                to={`/anuncios/${fila.id}/constancias`}
                aria-label={`Constancia de «${fila.titulo}»`}
                className="text-slate-900 underline"
              >
                Ver constancia
              </Link>
            </li>
          ))}
        </ul>
      )}
      {respuesta.datos && (
        <Paginacion
          pagina={pagina}
          porPagina={POR_PAGINA}
          total={respuesta.total}
          alCambiar={setPagina}
        />
      )}
    </section>
  );
}
