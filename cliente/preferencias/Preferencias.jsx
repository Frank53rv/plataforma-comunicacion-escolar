// RF-33 Configuración de preferencias · CU-13 · RN-18, RN-24
// Prueba: CP-RF-33
//
// TC-07, TC-20 y TC-24 (Tabla 17) · GET y PUT /usuarios/me/preferencias, los cuatro roles.
// RF-33 · «La interfaz debe indicar de forma visible que los anuncios institucionales no están
// alcanzados por esta configuración» (RN-18). RN-24 · fuera del horario los avisos de mensajes
// se difieren, no se descartan. Sin configuración previa la interfaz declara disponibilidad
// permanente (00:00–00:00). La franja, sus extremos y su cruce de medianoche los resuelve la
// interfaz de programación (specs/25-semantica-temporal.md): el cliente sólo los edita.
import { useEffect, useState } from "react";
import { mensajeDeError } from "../comun/api.js";
import { useSesion } from "../comun/contextoSesion.js";
import { Alerta, Boton, Campo } from "../comun/formularios.jsx";
import AvisosEnEsteDispositivo from "./AvisosEnEsteDispositivo.jsx";

export default function Preferencias() {
  const { api } = useSesion();
  const [formulario, setFormulario] = useState(null);
  const [errorDeCarga, setErrorDeCarga] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    let vigente = true;
    api
      .get("/usuarios/me/preferencias")
      .then(
        ({ hora_inicio, hora_fin, recibir_mensajes }) =>
          vigente && setFormulario({ hora_inicio, hora_fin, recibir_mensajes }),
      )
      .catch((fallo) => vigente && setErrorDeCarga(mensajeDeError(fallo)));
    return () => {
      vigente = false;
    };
  }, [api]);

  async function guardar(evento) {
    evento.preventDefault();
    setError(null);
    setGuardado(false);
    setGuardando(true);
    try {
      await api.put("/usuarios/me/preferencias", formulario);
      setGuardado(true);
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setGuardando(false);
    }
  }

  if (errorDeCarga) return <Alerta mensaje={errorDeCarga} />;
  if (!formulario) return <p role="status">Cargando…</p>;

  const cambiar = (campo, valor) => {
    setGuardado(false);
    setFormulario({ ...formulario, [campo]: valor });
  };

  return (
    <section>
      <h2 className="mb-2 text-xl font-semibold text-slate-900">
        Horario de disponibilidad y preferencias
      </h2>
      <p className="mb-2 max-w-2xl text-sm text-slate-700">
        Los anuncios institucionales no dependen de esta configuración: llegan
        siempre, sea cual sea el horario o la preferencia elegidos.
      </p>
      <p className="mb-4 max-w-2xl text-sm text-slate-700">
        Fuera del horario, los avisos de mensajes se difieren hasta que empiece
        el horario, no se pierden. Si Hasta es anterior a Desde, el horario
        cruza la medianoche. Si Desde y Hasta son iguales, rige la
        disponibilidad permanente.
      </p>
      <form onSubmit={guardar} className="max-w-2xl">
        <Alerta mensaje={error} />
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Campo
            etiqueta="Desde"
            tipo="time"
            valor={formulario.hora_inicio}
            alCambiar={(v) => cambiar("hora_inicio", v)}
          />
          <Campo
            etiqueta="Hasta"
            tipo="time"
            valor={formulario.hora_fin}
            alCambiar={(v) => cambiar("hora_fin", v)}
          />
        </div>
        <label className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            checked={formulario.recibir_mensajes}
            onChange={(evento) =>
              cambiar("recibir_mensajes", evento.target.checked)
            }
          />
          Recibir avisos de mensajes
        </label>
        <div className="w-40">
          <Boton disabled={guardando}>Guardar</Boton>
        </div>
        {guardado && (
          <p role="status" className="mt-3 text-sm text-slate-900">
            Preferencias guardadas.
          </p>
        )}
      </form>
      <AvisosEnEsteDispositivo />
    </section>
  );
}
