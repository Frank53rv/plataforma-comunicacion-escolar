// RF-39 Bandeja de anuncios · RF-22 · RF-36 Idempotencia de eventos · CU-09, CU-10 · RN-15,
// RN-32
// Prueba: CP-RF-39 · CP-RF-22 · CP-RF-36
//
// Detalle de un anuncio: su publicación vigente y sus cursos. Al abrirlo, un destinatario
// emite la lectura de la publicación (CU-10); que la reemisión no altere la marca original
// es de la interfaz de programación. Un anuncio ajeno a las vinculaciones de quien consulta
// responde 404 y se presenta como inexistente (CU-09 E1, RN-15). RF-30 (adjuntos) es Should
// have: no se presentan.
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { mensajeDeError } from "../comun/api.js";
import { useSesion } from "../comun/contextoSesion.js";
import { formatearFechaHora } from "../comun/fechas.js";
import { Alerta } from "../comun/formularios.jsx";
import Iniciales from "../comun/Iniciales.jsx";
import AccionesDelAutor from "../paneles/docente/AccionesDelAutor.jsx";

export default function Detalle() {
  const { id } = useParams();
  const { panel, api, sesion } = useSesion();
  const autor = useLocation().state?.autor;
  const destinatario = panel.rol === "tutor" || panel.rol === "alumno";
  const [respuesta, setRespuesta] = useState(null);

  useEffect(() => {
    let vigente = true;
    api
      .get(`/anuncios/${id}`)
      .then((anuncio) => vigente && setRespuesta({ id, anuncio }))
      .catch(
        (error) =>
          vigente && setRespuesta({ id, error: mensajeDeError(error) }),
      );
    return () => {
      vigente = false;
    };
  }, [api, id]);

  const anuncio = respuesta?.id === id ? respuesta.anuncio : undefined;
  const eliminado = anuncio?.estado === "eliminado";

  useEffect(() => {
    if (!anuncio || !destinatario || eliminado) return;
    api
      .post("/entregas/lecturas", { anuncio_version_id: anuncio.version.id })
      .catch(() => {});
  }, [api, anuncio, destinatario, eliminado]);

  const volver = (
    <Link
      to="/"
      className="mb-4 inline-flex items-center gap-1 rounded-full py-1 pr-3 pl-1 text-sm text-emerald-800 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-emerald-700"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-5 stroke-current"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Volver a los anuncios
    </Link>
  );

  if (respuesta?.id !== id)
    return (
      <p role="status" className="text-slate-700">
        Cargando…
      </p>
    );
  if (respuesta.error) {
    return (
      <section className="mx-auto max-w-3xl">
        {volver}
        <Alerta mensaje={respuesta.error} />
      </section>
    );
  }

  const { version, cursos } = respuesta.anuncio;
  const esAutor =
    sesion?.usuario_id === respuesta.anuncio.autor_id && !eliminado;
  return (
    <article className="mx-auto max-w-3xl transition duration-200 starting:translate-x-4 starting:opacity-0 motion-reduce:transition-none">
      {volver}
      {esAutor && <AccionesDelAutor anuncio={respuesta.anuncio} />}
      {eliminado && (
        <p className="mb-3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          Este anuncio fue eliminado.
        </p>
      )}
      <div className="rounded-2xl bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-xl font-semibold text-slate-900">
          {version.titulo}
        </h2>
        <div className="mt-3 mb-4 flex items-center gap-3">
          {autor && (
            <Iniciales
              nombre={`${autor.nombre} ${autor.apellido}`}
              semilla={autor.id}
            />
          )}
          <p className="text-sm text-slate-600">
            {autor && (
              <>
                Publicado por{" "}
                <span className="font-medium text-slate-900">{`${autor.nombre} ${autor.apellido}`}</span>{" "}
                ·{" "}
              </>
            )}
            <span>{formatearFechaHora(version.publicado_en)}</span>
          </p>
        </div>
        <p className="mb-4 text-sm text-slate-700">
          Cursos:{" "}
          <span className="rounded-full bg-stone-100 px-2 py-0.5">
            {cursos.map((curso) => curso.nombre).join(", ")}
          </span>
        </p>
        <p className="leading-relaxed whitespace-pre-wrap text-slate-900">
          {version.cuerpo}
        </p>
      </div>
    </article>
  );
}
