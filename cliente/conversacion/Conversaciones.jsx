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
import { Alerta } from "../comun/formularios.jsx";
import Iniciales from "../comun/Iniciales.jsx";

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
  if (respuesta.error) return <Alerta mensaje={respuesta.error} />;

  const nombreDelCurso = (id) =>
    panel.cursos.find((curso) => curso.id === id)?.nombre;
  return (
    <section className="mx-auto max-w-3xl">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">
        Canal grupal
      </h2>
      {respuesta.datos.length === 0 && (
        <p className="rounded-2xl bg-white p-4 text-slate-700 shadow-sm">
          No hay canales grupales.
        </p>
      )}
      <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white shadow-sm empty:hidden">
        {respuesta.datos.map((canal) => {
          const curso = nombreDelCurso(canal.curso_id);
          const ultimo = canal.ultimo_mensaje;
          const titulo = curso ? `Canal grupal · ${curso}` : "Canal grupal";
          return (
            <li
              key={canal.id}
              className="relative flex min-h-16 items-center gap-3 px-3 py-3 hover:bg-stone-50"
            >
              <Iniciales
                nombre={curso ?? "Canal grupal"}
                semilla={curso ?? canal.id}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <Link
                    to={`/conversaciones/${canal.id}`}
                    state={{ curso }}
                    className="line-clamp-1 min-w-0 break-words font-semibold text-slate-900 after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-rol-700"
                  >
                    {titulo}
                  </Link>
                  {ultimo && (
                    <span className="shrink-0 text-xs text-slate-600">
                      {formatearFechaHora(ultimo.enviado_en)}
                    </span>
                  )}
                </div>
                <p className="line-clamp-1 break-words text-sm text-slate-600">
                  {ultimo ? (
                    <span>{`${ultimo.autor.nombre} ${ultimo.autor.apellido}: ${ultimo.cuerpo}`}</span>
                  ) : (
                    "Todavía no hay mensajes."
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
