// RF-25 Canal grupal del curso · RF-29 Restricción de participación · CU-12 · RN-23
// Prueba: CP-RF-25 · CP-RF-29
//
// Tabla 18 · GET /cursos/{id}/conversaciones · «las conversaciones del curso visibles para el
// rol, con tipo y estado» (Tabla 29). Es la entrada al canal desde un curso. La colección la
// decide la interfaz de programación: el alumno la recibe vacía (el canal de RF-25 es de
// docentes y tutores) y quien no está vinculado al curso, un 403 que se presenta como tal
// (RF-29). RF-26 y RF-27 (conversaciones privadas) son Should have: no se ofrecen.
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { mensajeDeError } from "../comun/api.js";
import { useSesion } from "../comun/contextoSesion.js";

const ESTADOS = { activa: "Activo", solo_lectura: "Sólo lectura" };

export default function CanalesDelCurso() {
  const { id } = useParams();
  const { api, panel } = useSesion();
  const nombre =
    useLocation().state?.curso ??
    panel.cursos.find((curso) => curso.id === id)?.nombre;
  const [respuesta, setRespuesta] = useState(null);

  useEffect(() => {
    let vigente = true;
    api
      .get(`/cursos/${id}/conversaciones`)
      .then((datos) => vigente && setRespuesta({ id, canales: datos.datos }))
      .catch(
        (fallo) =>
          vigente && setRespuesta({ id, error: mensajeDeError(fallo) }),
      );
    return () => {
      vigente = false;
    };
  }, [api, id]);

  if (respuesta?.id !== id) return <p role="status">Cargando…</p>;

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-slate-900">
        {nombre ? `Canal grupal · ${nombre}` : "Canal grupal"}
      </h2>
      {respuesta.error && (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {respuesta.error}
        </p>
      )}
      {respuesta.canales?.length === 0 && (
        <p className="text-slate-700">
          Este curso no tiene un canal grupal para esta cuenta.
        </p>
      )}
      <ul className="divide-y divide-slate-200 empty:hidden">
        {respuesta.canales?.map((canal) => (
          <li
            key={canal.id}
            className="flex flex-wrap items-baseline gap-x-4 py-3"
          >
            <span className="text-sm text-slate-700">
              {ESTADOS[canal.estado]}
            </span>
            <Link
              to={`/conversaciones/${canal.id}`}
              state={{ curso: nombre }}
              className="font-medium text-slate-900 underline"
            >
              Abrir el canal grupal
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
