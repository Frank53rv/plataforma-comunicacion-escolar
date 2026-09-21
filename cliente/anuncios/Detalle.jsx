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

export default function Detalle() {
  const { id } = useParams();
  const { panel, api } = useSesion();
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
    <Link to="/" className="mb-4 inline-block text-sm text-slate-700 underline">
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

  const { version, cursos } = respuesta.anuncio;
  return (
    <article>
      {volver}
      {eliminado && (
        <p className="mb-3 rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
          Este anuncio fue eliminado.
        </p>
      )}
      <h2 className="text-xl font-semibold text-slate-900">{version.titulo}</h2>
      <p className="mb-4 text-sm text-slate-600">
        {autor && (
          <>
            Publicado por <span>{`${autor.nombre} ${autor.apellido}`}</span>{" "}
            ·{" "}
          </>
        )}
        <span>{formatearFechaHora(version.publicado_en)}</span>
      </p>
      <p className="mb-4 text-sm text-slate-700">
        Cursos: <span>{cursos.map((curso) => curso.nombre).join(", ")}</span>
      </p>
      <p className="whitespace-pre-wrap text-slate-900">{version.cuerpo}</p>
    </article>
  );
}
