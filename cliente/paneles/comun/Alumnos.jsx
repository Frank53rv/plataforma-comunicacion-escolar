// RF-04 Alta de alumnos y tutores · RF-05 · RF-07 · RF-09 Baja de alumnos · RF-10 Baja de
// tutores · RF-13 Vinculación de alumnos a cursos · RF-14 Vinculación de tutores · CU-05 ·
// RN-06, RN-11, RN-12
// Prueba: CP-RF-04 · CP-RF-05 · CP-RF-07 · CP-RF-09 · CP-RF-10 · CP-RF-13 · CP-RF-14
//
// TC-09 y TC-10 (Tabla 17) · dar de alta a un alumno en un curso, registrar sus tutores, y dar
// de baja a un alumno y a un tutor. La alta, la vinculación de tutores y la regeneración del
// código de activación son del docente; la baja, del directivo y del docente titular del curso
// (Tabla 18). Cada control se dibuja sólo si la interfaz de programación habilitó esa capacidad
// en el panel de la persona o, para la baja del docente, si la nómina lo muestra titular del
// curso; el 403 lo sigue resolviendo el servidor. RN-12 · un tutor con algún alumno activo no
// se da de baja: el rechazo se presenta con su regla. Las bajas piden confirmación (RNF-14).
import { useState } from "react";
import { mensajeDeError } from "../../comun/api.js";
import CodigoDeActivacion from "../../comun/CodigoDeActivacion.jsx";
import Confirmacion from "../../comun/Confirmacion.jsx";
import { useSesion } from "../../comun/contextoSesion.js";
import { Alerta, Boton, Campo, Selector } from "../../comun/formularios.jsx";
import { useCursosConNomina } from "../../comun/useCursosConNomina.js";

const nombreDe = (persona) => `${persona.nombre} ${persona.apellido}`;
const VACIA = { nombre: "", apellido: "", correo: "" };
const BOTON = "rounded border border-slate-300 px-3 py-1 text-sm";

export default function Alumnos() {
  const { api, panel, sesion } = useSesion();
  const {
    cursos,
    error: errorDeCarga,
    cargando,
    recargar,
  } = useCursosConNomina();
  const administra = panel.opciones_habilitadas.includes("anios_lectivos");
  const altas = panel.opciones_habilitadas.includes(
    "altas_de_alumnos_y_tutores",
  );

  const [alumnoNuevo, setAlumnoNuevo] = useState({ ...VACIA, curso_id: "" });
  const [tutorDe, setTutorDe] = useState(null);
  const [tutorNuevo, setTutorNuevo] = useState(VACIA);
  const [codigo, setCodigo] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [trabajando, setTrabajando] = useState(false);
  const [baja, setBaja] = useState(null);

  async function ejecutar(accion, exito) {
    setError(null);
    setMensaje(null);
    setTrabajando(true);
    try {
      await accion();
      if (exito) setMensaje(exito);
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setTrabajando(false);
    }
  }

  const darDeAltaAlAlumno = (evento) => {
    evento.preventDefault();
    if (!alumnoNuevo.curso_id) {
      setError("Elegir el curso del alumno.");
      return undefined;
    }
    return ejecutar(async () => {
      const respuesta = await api.post("/alumnos", alumnoNuevo);
      setCodigo({
        para: nombreDe(respuesta.usuario),
        codigo: respuesta.codigo_activacion,
      });
      setAlumnoNuevo({ ...VACIA, curso_id: alumnoNuevo.curso_id });
      recargar();
    }, "Alumno dado de alta.");
  };

  const vincularTutor = (evento) => {
    evento.preventDefault();
    return ejecutar(async () => {
      const respuesta = await api.post(
        `/alumnos/${tutorDe}/tutores`,
        tutorNuevo,
      );
      if (respuesta.codigo_activacion)
        setCodigo({
          para: nombreDe(respuesta.usuario),
          codigo: respuesta.codigo_activacion,
        });
      else
        setMensaje(
          "El tutor ya tenía cuenta: quedó vinculado, sin código nuevo.",
        );
      setTutorDe(null);
      setTutorNuevo(VACIA);
      recargar();
    });
  };

  const regenerar = (persona) =>
    ejecutar(async () => {
      setCodigo({
        para: nombreDe(persona),
        codigo: await api.post(`/usuarios/${persona.id}/codigos-activacion`),
      });
    });

  const darDeBaja = () =>
    ejecutar(
      async () => {
        // Dos llamadas explícitas, no una ruta armada: cada operación de la Tabla 18 tiene su
        // llamada a la vista (la comprobación de RF-42 lee el código).
        if (baja.tipo === "alumno")
          await api.delete(`/alumnos/${baja.persona.id}`);
        else await api.delete(`/tutores/${baja.persona.id}`);
        recargar();
      },
      baja.tipo === "alumno" ? "Alumno dado de baja." : "Tutor dado de baja.",
    ).finally(() => setBaja(null));

  if (errorDeCarga) return <Alerta mensaje={errorDeCarga} />;
  if (cargando) return <p role="status">Cargando…</p>;

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-slate-900">
        Alumnos y tutores
      </h2>
      <Alerta mensaje={error} />
      {mensaje && (
        <p role="status" className="mb-3 text-sm text-slate-900">
          {mensaje}
        </p>
      )}
      {codigo && (
        <CodigoDeActivacion
          para={codigo.para}
          codigo={codigo.codigo}
          alCerrar={() => setCodigo(null)}
        />
      )}

      {altas && (
        <form onSubmit={darDeAltaAlAlumno} className="mb-8 max-w-md">
          <h3 className="mb-2 font-medium text-slate-900">
            Dar de alta a un alumno
          </h3>
          <Campo
            etiqueta="Nombre"
            valor={alumnoNuevo.nombre}
            alCambiar={(nombre) => setAlumnoNuevo({ ...alumnoNuevo, nombre })}
          />
          <Campo
            etiqueta="Apellido"
            valor={alumnoNuevo.apellido}
            alCambiar={(apellido) =>
              setAlumnoNuevo({ ...alumnoNuevo, apellido })
            }
          />
          <Campo
            etiqueta="Correo"
            tipo="email"
            valor={alumnoNuevo.correo}
            alCambiar={(correo) => setAlumnoNuevo({ ...alumnoNuevo, correo })}
          />
          <Selector
            etiqueta="Curso"
            valor={alumnoNuevo.curso_id}
            opciones={[
              { valor: "", etiqueta: "Elegir…" },
              ...cursos.map((c) => ({ valor: c.id, etiqueta: c.nombre })),
            ]}
            alCambiar={(curso_id) =>
              setAlumnoNuevo({ ...alumnoNuevo, curso_id })
            }
          />
          <Boton disabled={trabajando}>Dar de alta al alumno</Boton>
        </form>
      )}

      {cursos.length === 0 && (
        <p className="text-slate-700">Todavía no hay cursos.</p>
      )}
      {cursos.map((curso) => {
        const titular = curso.docentes.some(
          (d) => d.id === sesion.usuario_id && d.es_titular,
        );
        const puedeDarDeBaja = administra || titular;
        return (
          <section key={curso.id} aria-label={curso.nombre} className="mb-6">
            <h3 className="mb-2 font-medium text-slate-900">{curso.nombre}</h3>
            {curso.alumnos.length === 0 && (
              <p className="text-sm text-slate-700">Sin alumnos vinculados.</p>
            )}
            <ul className="divide-y divide-slate-200 border-y border-slate-200 empty:hidden">
              {curso.alumnos.map((alumno) => (
                <li key={alumno.id} className="py-3">
                  <Fila
                    persona={alumno}
                    acciones={[
                      altas &&
                        alumno.estado !== "dado_de_baja" && {
                          texto: "Agregar tutor",
                          nombre: `Agregar un tutor a «${nombreDe(alumno)}»`,
                          alPulsar: () => setTutorDe(alumno.id),
                        },
                      ...accionesComunes(alumno, "alumno"),
                    ]}
                  />
                  {baja?.persona.id === alumno.id && (
                    <ConfirmarBaja
                      baja={baja}
                      ocupado={trabajando}
                      alConfirmar={darDeBaja}
                      alCancelar={() => setBaja(null)}
                    />
                  )}
                  {tutorDe === alumno.id && (
                    <form
                      onSubmit={vincularTutor}
                      className="mt-3 max-w-md rounded border border-slate-200 p-3"
                    >
                      <Campo
                        etiqueta="Nombre del tutor"
                        valor={tutorNuevo.nombre}
                        alCambiar={(nombre) =>
                          setTutorNuevo({ ...tutorNuevo, nombre })
                        }
                      />
                      <Campo
                        etiqueta="Apellido del tutor"
                        valor={tutorNuevo.apellido}
                        alCambiar={(apellido) =>
                          setTutorNuevo({ ...tutorNuevo, apellido })
                        }
                      />
                      <Campo
                        etiqueta="Correo del tutor"
                        tipo="email"
                        valor={tutorNuevo.correo}
                        alCambiar={(correo) =>
                          setTutorNuevo({ ...tutorNuevo, correo })
                        }
                      />
                      <div className="flex gap-3">
                        <div className="w-40">
                          <Boton disabled={trabajando}>Vincular tutor</Boton>
                        </div>
                        <button
                          type="button"
                          className={BOTON}
                          onClick={() => setTutorDe(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                  {alumno.tutores.length > 0 && (
                    <ul className="ml-4 mt-2 space-y-2 border-l border-slate-200 pl-3">
                      {alumno.tutores.map((tutor) => (
                        <li key={tutor.id}>
                          <Fila
                            persona={tutor}
                            etiqueta="Tutor"
                            acciones={accionesComunes(tutor, "tutor")}
                          />
                          {baja?.persona.id === tutor.id && (
                            <ConfirmarBaja
                              baja={baja}
                              ocupado={trabajando}
                              alConfirmar={darDeBaja}
                              alCancelar={() => setBaja(null)}
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );

        function accionesComunes(persona, tipo) {
          if (persona.estado === "dado_de_baja") return [];
          return [
            altas &&
              persona.estado === "pendiente" && {
                texto: "Regenerar código de activación",
                nombre: `Regenerar el código de activación de «${nombreDe(persona)}»`,
                alPulsar: () => regenerar(persona),
              },
            puedeDarDeBaja && {
              texto: "Dar de baja",
              nombre: `Dar de baja a «${nombreDe(persona)}»`,
              alPulsar: () => setBaja({ persona, tipo }),
            },
          ];
        }
      })}
    </section>
  );
}

function Fila({ persona, etiqueta, acciones }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span>
        {etiqueta && (
          <span className="mr-2 text-xs text-slate-600">{etiqueta}</span>
        )}
        <span className="text-slate-900">{nombreDe(persona)}</span>
        {persona.estado === "pendiente" && (
          <span className="ml-2 text-xs text-slate-600">
            Pendiente de activación
          </span>
        )}
        {persona.estado === "dado_de_baja" && (
          <span className="ml-2 text-xs text-slate-600">Dado de baja</span>
        )}
      </span>
      <span className="flex flex-wrap gap-2">
        {acciones.filter(Boolean).map((accion) => (
          <button
            key={accion.texto}
            type="button"
            className={BOTON}
            aria-label={accion.nombre}
            onClick={accion.alPulsar}
          >
            {accion.texto}
          </button>
        ))}
      </span>
    </div>
  );
}

function ConfirmarBaja({ baja, ocupado, alConfirmar, alCancelar }) {
  return (
    <Confirmacion
      etiqueta="Confirmar la baja"
      texto={`¿Dar de baja a ${nombreDe(baja.persona)}? La cuenta pierde el acceso y se conserva su historial.`}
      confirmar="Confirmar baja"
      ocupado={ocupado}
      alConfirmar={alConfirmar}
      alCancelar={alCancelar}
    />
  );
}
