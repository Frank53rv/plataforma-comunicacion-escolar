// RF-03 Alta de docentes · RF-05 · RF-07 Regeneración del código de activación · RF-15
// Asignación de docentes a cursos · RF-44 Desvinculación · CU-04 · RN-06, RN-13
// Prueba: CP-RF-03 · CP-RF-05 · CP-RF-07 · CP-RF-15 · CP-RF-44
//
// TC-03, TC-04 y TC-05 (Tabla 17) · dar de alta a un docente y asignarlo a un curso como
// titular, regenerar su código de activación, y desvincularlo designando otro titular en el
// mismo acto. RN-13 · un curso tiene un titular vigente: lo que la interfaz de programación
// rechaza se presenta con su regla. Desvincular y dar de baja piden confirmación (RNF-14). Una
// persona sin vinculaciones no figura en ninguna nómina: por eso, tras desvincular a un docente
// se ofrece dar de baja su cuenta en el momento, y un docente recién dado de alta queda a mano
// para vincularlo.
import { useState } from "react";
import { mensajeDeError } from "../../comun/api.js";
import CodigoDeActivacion from "../../comun/CodigoDeActivacion.jsx";
import Confirmacion from "../../comun/Confirmacion.jsx";
import { Alerta, Boton, Campo, Selector } from "../../comun/formularios.jsx";
import { useSesion } from "../../comun/contextoSesion.js";
import { useCursosConNomina } from "../../comun/useCursosConNomina.js";

const nombreDe = (persona) => `${persona.nombre} ${persona.apellido}`;
const porApellido = (a, b) =>
  nombreDe({ nombre: a.apellido, apellido: a.nombre }).localeCompare(
    nombreDe({ nombre: b.apellido, apellido: b.nombre }),
  );

export default function Docentes() {
  const {
    cursos,
    error: errorDeCarga,
    cargando,
    recargar,
  } = useCursosConNomina();
  const [alta, setAlta] = useState({ nombre: "", apellido: "", correo: "" });
  const [nuevos, setNuevos] = useState([]);
  const [vinculo, setVinculo] = useState({
    curso: "",
    docente: "",
    titular: false,
  });
  const [codigo, setCodigo] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [trabajando, setTrabajando] = useState(false);
  const [desvinculando, setDesvinculando] = useState(null);
  const [bajaOfrecida, setBajaOfrecida] = useState(null);
  const { api } = useSesion();

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

  // El diálogo guarda identificadores, no copias: la nómina se recarga tras cada acción y una
  // copia guardada al abrirlo quedaría desactualizada.
  const vigenteDe = (estado) => {
    const curso = cursos.find((c) => c.id === estado.cursoId);
    return {
      curso,
      docente: curso.docentes.find((d) => d.id === estado.docenteId),
      reemplazo: estado.reemplazo,
    };
  };

  const darDeAlta = (evento) => {
    evento.preventDefault();
    return ejecutar(async () => {
      const respuesta = await api.post("/docentes", alta);
      setNuevos((previos) => [
        ...previos,
        { ...respuesta.usuario, es_titular: false },
      ]);
      setCodigo({
        para: nombreDe(respuesta.usuario),
        codigo: respuesta.codigo_activacion,
      });
      setAlta({ nombre: "", apellido: "", correo: "" });
    }, "Docente dado de alta.");
  };

  const vincular = (evento) => {
    evento.preventDefault();
    if (!vinculo.docente || !vinculo.curso) {
      setError("Elegir un docente y un curso.");
      return undefined;
    }
    const curso = cursos.find((c) => c.id === vinculo.curso);
    return ejecutar(async () => {
      await api.post(`/cursos/${curso.id}/docentes`, {
        usuario_id: vinculo.docente,
        es_titular: vinculo.titular,
      });
      setVinculo({ curso: "", docente: "", titular: false });
      recargar();
    }, `Docente vinculado a «${curso.nombre}».`);
  };

  const desvincular = () => {
    const { curso, docente, reemplazo } = vigenteDe(desvinculando);
    return ejecutar(async () => {
      await api.delete(
        `/cursos/${curso.id}/docentes/${docente.id}`,
        docente.es_titular ? { titular_reemplazo_id: reemplazo } : undefined,
      );
      setDesvinculando(null);
      setBajaOfrecida({ id: docente.id, nombre: nombreDe(docente) });
      recargar();
    }, "Docente desvinculado.").finally(() => setDesvinculando(null));
  };

  const darDeBaja = () =>
    ejecutar(async () => {
      await api.delete(`/docentes/${bajaOfrecida.id}`);
      recargar();
    }, "Docente dado de baja.").finally(() => setBajaOfrecida(null));

  const regenerar = (docente) =>
    ejecutar(async () => {
      setCodigo({
        para: nombreDe(docente),
        codigo: await api.post(`/usuarios/${docente.id}/codigos-activacion`),
      });
    });

  if (errorDeCarga) return <Alerta mensaje={errorDeCarga} />;
  if (cargando) return <p role="status">Cargando…</p>;

  const cursoElegido = cursos.find((c) => c.id === vinculo.curso);
  const conocidos = new Map();
  [...cursos.flatMap((c) => c.docentes), ...nuevos].forEach((d) =>
    conocidos.set(d.id, d),
  );
  const candidatos = [...conocidos.values()]
    .filter(
      (d) =>
        d.estado !== "dado_de_baja" &&
        !cursoElegido?.docentes.some((x) => x.id === d.id),
    )
    .sort(porApellido);
  const opcion = (v, e) => ({ valor: v, etiqueta: e });

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Docentes</h2>
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
      {bajaOfrecida && (
        <Confirmacion
          etiqueta="Confirmar la baja"
          texto={`¿Dar de baja la cuenta de ${bajaOfrecida.nombre}? Pierde el acceso y se conserva su historial.`}
          confirmar="Confirmar baja"
          cancelar="Conservar la cuenta"
          ocupado={trabajando}
          alConfirmar={darDeBaja}
          alCancelar={() => setBajaOfrecida(null)}
        />
      )}

      <div className="mb-8 grid gap-8 lg:grid-cols-2">
        <form onSubmit={darDeAlta} className="max-w-md">
          <h3 className="mb-2 font-medium text-slate-900">
            Dar de alta a un docente
          </h3>
          <Campo
            etiqueta="Nombre"
            valor={alta.nombre}
            alCambiar={(nombre) => setAlta({ ...alta, nombre })}
          />
          <Campo
            etiqueta="Apellido"
            valor={alta.apellido}
            alCambiar={(apellido) => setAlta({ ...alta, apellido })}
          />
          <Campo
            etiqueta="Correo"
            tipo="email"
            valor={alta.correo}
            alCambiar={(correo) => setAlta({ ...alta, correo })}
          />
          <Boton disabled={trabajando}>Dar de alta</Boton>
        </form>

        <form onSubmit={vincular} className="max-w-md">
          <h3 className="mb-2 font-medium text-slate-900">
            Vincular un docente a un curso
          </h3>
          <Selector
            etiqueta="Curso"
            valor={vinculo.curso}
            opciones={[
              opcion("", "Elegir…"),
              ...cursos.map((c) => opcion(c.id, c.nombre)),
            ]}
            alCambiar={(curso) =>
              setVinculo({ ...vinculo, curso, docente: "" })
            }
          />
          <Selector
            etiqueta="Docente"
            valor={vinculo.docente}
            opciones={[
              opcion("", "Elegir…"),
              ...candidatos.map((d) => opcion(d.id, nombreDe(d))),
            ]}
            alCambiar={(docente) => setVinculo({ ...vinculo, docente })}
          />
          <label className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={vinculo.titular}
              onChange={(evento) =>
                setVinculo({ ...vinculo, titular: evento.target.checked })
              }
            />
            Titular del curso
          </label>
          <Boton disabled={trabajando}>Vincular</Boton>
        </form>
      </div>

      {cursos.length === 0 && (
        <p className="text-slate-700">Todavía no hay cursos.</p>
      )}
      {cursos.map((curso) => (
        <section key={curso.id} aria-label={curso.nombre} className="mb-6">
          <h3 className="mb-2 font-medium text-slate-900">{curso.nombre}</h3>
          {curso.docentes.length === 0 && (
            <p className="text-sm text-slate-700">Sin docentes vinculados.</p>
          )}
          <ul className="divide-y divide-slate-200 border-y border-slate-200 empty:hidden">
            {curso.docentes.map((docente) => {
              const activo = docente.estado !== "dado_de_baja";
              const boton = "rounded border border-slate-300 px-3 py-1 text-sm";
              return (
                <li key={docente.id} className="py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <span className="text-slate-900">
                        {nombreDe(docente)}
                      </span>
                      {docente.es_titular && (
                        <span className="ml-2 rounded bg-slate-900 px-2 py-0.5 text-xs text-white">
                          Titular
                        </span>
                      )}
                      {docente.estado === "pendiente" && (
                        <span className="ml-2 text-xs text-slate-600">
                          Pendiente de activación
                        </span>
                      )}
                      {!activo && (
                        <span className="ml-2 text-xs text-slate-600">
                          Dado de baja
                        </span>
                      )}
                    </span>
                    {activo && (
                      <span className="flex gap-2">
                        {docente.estado === "pendiente" && (
                          <button
                            type="button"
                            className={boton}
                            aria-label={`Regenerar el código de activación de «${nombreDe(docente)}»`}
                            onClick={() => regenerar(docente)}
                          >
                            Regenerar código de activación
                          </button>
                        )}
                        <button
                          type="button"
                          className={boton}
                          aria-label={`Desvincular a «${nombreDe(docente)}»`}
                          onClick={() =>
                            setDesvinculando({
                              cursoId: curso.id,
                              docenteId: docente.id,
                              reemplazo: "",
                            })
                          }
                        >
                          Desvincular
                        </button>
                      </span>
                    )}
                  </div>
                  {desvinculando?.docenteId === docente.id &&
                    desvinculando.cursoId === curso.id && (
                      <Desvinculacion
                        estado={desvinculando}
                        curso={curso}
                        docente={docente}
                        alCambiar={setDesvinculando}
                        ocupado={trabajando}
                        alConfirmar={desvincular}
                      />
                    )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </section>
  );
}

function Desvinculacion({
  estado,
  curso,
  docente,
  alCambiar,
  ocupado,
  alConfirmar,
}) {
  const { reemplazo } = estado;
  const otros = curso.docentes.filter(
    (d) => d.id !== docente.id && d.estado !== "dado_de_baja",
  );
  const sinReemplazo = docente.es_titular && otros.length === 0;
  return (
    <Confirmacion
      etiqueta="Confirmar la desvinculación"
      texto={`¿Desvincular a ${nombreDe(docente)} de ${curso.nombre}?`}
      confirmar="Confirmar desvinculación"
      ocupado={ocupado}
      deshabilitarConfirmar={docente.es_titular && (sinReemplazo || !reemplazo)}
      alConfirmar={alConfirmar}
      alCancelar={() => alCambiar(null)}
    >
      {docente.es_titular &&
        (sinReemplazo ? (
          <p className="mb-3 text-sm text-red-900">
            No hay otro docente en el curso para designar como titular.
          </p>
        ) : (
          <Selector
            etiqueta="Nuevo titular"
            valor={reemplazo}
            opciones={[
              { valor: "", etiqueta: "Elegir…" },
              ...otros.map((d) => ({ valor: d.id, etiqueta: nombreDe(d) })),
            ]}
            alCambiar={(valor) => alCambiar({ ...estado, reemplazo: valor })}
          />
        ))}
    </Confirmacion>
  );
}
