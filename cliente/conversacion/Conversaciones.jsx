// RF-25 Canal grupal del curso · RF-28 · CU-12 · RN-23
// Prueba: CP-RF-25 · CP-RF-28
//
// Los canales grupales de la persona, con el último mensaje. La colección la decide la
// interfaz de programación según el rol y las vinculaciones vigentes (RN-23): el cliente no
// agrega ni quita ninguno. RF-26 y RF-27 (conversaciones privadas) son Should have.
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { mensajeDeError } from "../comun/api.js";
import { useSesion } from "../comun/contextoSesion.js";
import { formatearFechaHora } from "../comun/fechas.js";

export default function Conversaciones() {
  const { panel, api } = useSesion();
  const [respuesta, setRespuesta] = useState(null);

  useEffect(() => {
    let vigente = true;
    api
      .get("/conversaciones?pagina=1&por_pagina=25")
      .then((datos) => vigente && setRespuesta(datos))
      .catch(
        (error) => vigente && setRespuesta({ error: mensajeDeError(error) }),
      );
    return () => {
      vigente = false;
    };
  }, [api]);

  if (!respuesta) return <p role="status">Cargando…</p>;
  if (respuesta.error) {
    return (
      <p
        role="alert"
        className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
      >
        {respuesta.error}
      </p>
    );
  }

  const nombreDelCurso = (id) =>
    panel.cursos.find((curso) => curso.id === id)?.nombre;
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-slate-900">
        Canal grupal
      </h2>
      {respuesta.datos.length === 0 && (
        <p className="text-slate-700">No hay canales grupales.</p>
      )}
      <ul className="divide-y divide-slate-200 border-y border-slate-200 empty:hidden">
        {respuesta.datos.map((canal) => {
          const curso = nombreDelCurso(canal.curso_id);
          const ultimo = canal.ultimo_mensaje;
          return (
            <li key={canal.id} className="py-3">
              <Link
                to={`/conversaciones/${canal.id}`}
                state={{ curso }}
                className="font-medium text-slate-900 underline"
              >
                {curso ? `Canal grupal · ${curso}` : "Canal grupal"}
              </Link>
              {ultimo ? (
                <p className="text-sm text-slate-600">
                  <span>{`${ultimo.autor.nombre} ${ultimo.autor.apellido}: ${ultimo.cuerpo}`}</span>{" "}
                  · <span>{formatearFechaHora(ultimo.enviado_en)}</span>
                </p>
              ) : (
                <p className="text-sm text-slate-600">
                  Todavía no hay mensajes.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
