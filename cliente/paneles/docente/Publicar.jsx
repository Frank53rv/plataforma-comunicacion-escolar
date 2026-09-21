// RF-17 Publicación de anuncios · CU-06 · RN-16,
// RN-17, RN-18, RN-19
// Prueba: CP-RF-17
//
// TC-11 (Tabla 17) · publicar un anuncio dirigido a uno o varios de los cursos del docente.
// Los destinatarios los resuelve la interfaz de programación en el momento de publicar
// (RN-19) y el cliente presenta cuántos son. RF-18 (programar el envío) y RF-30 (adjuntos)
// son Should have: el formulario no los ofrece.
import { useState } from "react";
import { Link } from "react-router";
import { mensajeDeError } from "../../comun/api.js";
import { useSesion } from "../../comun/contextoSesion.js";
import { Alerta, AreaDeTexto, Boton, Campo } from "../../comun/formularios.jsx";

const VACIO = { titulo: "", cuerpo: "", cursos: [] };

export default function Publicar() {
  const { panel, api } = useSesion();
  const [formulario, setFormulario] = useState(VACIO);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [publicado, setPublicado] = useState(null);

  function alternarCurso(id) {
    const cursos = formulario.cursos.includes(id)
      ? formulario.cursos.filter((curso) => curso !== id)
      : [...formulario.cursos, id];
    setFormulario({ ...formulario, cursos });
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    if (formulario.cursos.length === 0) {
      setError("Elegir al menos un curso.");
      return;
    }
    setEnviando(true);
    try {
      setPublicado(await api.post("/anuncios", formulario));
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setEnviando(false);
    }
  }

  if (publicado) {
    return (
      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          Publicar un anuncio
        </h2>
        <p role="status" className="mb-4 text-slate-900">
          {`Anuncio publicado. Destinatarios: ${publicado.destinatarios_resueltos}.`}
        </p>
        <div className="flex items-center gap-4">
          <Link
            to={`/anuncios/${publicado.id}`}
            className="text-slate-900 underline"
          >
            Ver el anuncio
          </Link>
          <button
            type="button"
            className="rounded border border-slate-300 px-4 py-2"
            onClick={() => {
              setFormulario(VACIO);
              setPublicado(null);
            }}
          >
            Publicar otro anuncio
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-2 text-xl font-semibold text-slate-900">
        Publicar un anuncio
      </h2>
      <p className="mb-4 text-sm text-slate-700">
        Los anuncios ignoran el horario de disponibilidad y las preferencias del
        destinatario: son comunicación institucional.
      </p>
      <form onSubmit={enviar} className="max-w-2xl">
        <Alerta mensaje={error} />
        <Campo
          etiqueta="Título"
          valor={formulario.titulo}
          alCambiar={(titulo) => setFormulario({ ...formulario, titulo })}
        />
        <AreaDeTexto
          etiqueta="Cuerpo"
          valor={formulario.cuerpo}
          alCambiar={(cuerpo) => setFormulario({ ...formulario, cuerpo })}
        />
        <fieldset className="mb-4">
          <legend className="text-sm font-medium text-slate-700">Cursos</legend>
          {panel.cursos.length === 0 && (
            <p className="text-sm text-slate-700">
              No hay cursos a los que dirigir un anuncio.
            </p>
          )}
          {panel.cursos.map((curso) => (
            <label key={curso.id} className="mt-1 flex items-center gap-2">
              <input
                type="checkbox"
                checked={formulario.cursos.includes(curso.id)}
                onChange={() => alternarCurso(curso.id)}
              />
              {curso.nombre}
            </label>
          ))}
        </fieldset>
        <div className="w-40">
          <Boton disabled={enviando || panel.cursos.length === 0}>
            Publicar
          </Boton>
        </div>
      </form>
    </section>
  );
}
