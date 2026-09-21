// RF-23 Constancias de lectura · CU-11 · RN-21
// Prueba: CP-RF-23
//
// RN-21 · «El docente ve, por anuncio, cuántos leyeron sobre el total y la nómina de quiénes
// no.» La nómina es de alumnos: la interfaz de programación no devuelve a cada tutor por
// separado. RF-38 (familia alcanzada) es Should have: no se presenta. Un anuncio que no es
// del docente responde 403 (CU-11 E1) y se presenta como tal.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { mensajeDeError } from "../../comun/api.js";
import { useSesion } from "../../comun/contextoSesion.js";
import Paginacion from "../../comun/Paginacion.jsx";

const POR_PAGINA = 25;

export default function Constancias() {
  const { id } = useParams();
  const { api } = useSesion();
  const [pagina, setPagina] = useState(1);
  const [respuesta, setRespuesta] = useState(null);

  useEffect(() => {
    let vigente = true;
    api
      .get(
        `/anuncios/${id}/constancias?pagina=${pagina}&por_pagina=${POR_PAGINA}`,
      )
      .then((datos) => vigente && setRespuesta({ id, pagina, ...datos }))
      .catch(
        (error) =>
          vigente && setRespuesta({ id, pagina, error: mensajeDeError(error) }),
      );
    return () => {
      vigente = false;
    };
  }, [api, id, pagina]);

  if (respuesta?.id !== id || respuesta.pagina !== pagina)
    return <p role="status">Cargando…</p>;

  const volver = (
    <Link
      to={`/anuncios/${id}`}
      className="mb-4 inline-block text-sm text-slate-700 underline"
    >
      Volver al anuncio
    </Link>
  );

  if (respuesta.error) {
    return (
      <section>
        {volver}
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {respuesta.error}
        </p>
      </section>
    );
  }

  const {
    total_destinatarios: total,
    con_lectura_registrada: leyeron,
    sin_lectura: sinLectura,
  } = respuesta;
  return (
    <section>
      {volver}
      <h2 className="mb-2 text-xl font-semibold text-slate-900">
        Constancia de lectura
      </h2>
      <p className="mb-4 text-slate-900">{`${leyeron} de ${total} destinatarios registraron lectura.`}</p>
      {sinLectura.length > 0 ? (
        <>
          <h3 className="mb-2 font-medium text-slate-900">
            Alumnos sin lectura registrada
          </h3>
          <ul
            aria-label="Alumnos sin lectura registrada"
            className="divide-y divide-slate-200 border-y border-slate-200"
          >
            {sinLectura.map(({ alumno }) => (
              <li
                key={alumno.id}
                className="py-2"
              >{`${alumno.nombre} ${alumno.apellido}`}</li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-slate-700">
          {leyeron >= total
            ? "Todos los destinatarios registraron lectura."
            : "No hay alumnos sin lectura registrada."}
        </p>
      )}
      <Paginacion
        pagina={pagina}
        porPagina={POR_PAGINA}
        total={respuesta.total}
        alCambiar={setPagina}
      />
    </section>
  );
}
