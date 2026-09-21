// RF-12 Gestión de cursos · CU-03 · RN-14, RN-31
// Prueba: CP-RF-12
//
// TC-02 (Tabla 17) · los cursos que integran el año lectivo: crearlos con su nombre y su turno
// y editarlos. GET /cursos lo consultan el directivo y el docente; crear y editar es del
// directivo. Los controles de administración se dibujan sólo cuando la interfaz de programación
// habilitó la administración de años lectivos en el panel de la persona; el 403 lo sigue
// resolviendo el servidor. La nómina de cada curso es de la rama de personas.
import { useEffect, useState } from "react";
import { mensajeDeError } from "../../comun/api.js";
import { useSesion } from "../../comun/contextoSesion.js";
import { Alerta, Boton, Campo, Selector } from "../../comun/formularios.jsx";
import Paginacion from "../../comun/Paginacion.jsx";

const POR_PAGINA = 25;
const ESTADOS = { vigente: "Vigente", archivado: "Archivado" };

function consultaDe(anioLectivo, pagina) {
  const parametros = new URLSearchParams();
  if (anioLectivo) parametros.set("anio_lectivo_id", anioLectivo);
  parametros.set("pagina", pagina);
  parametros.set("por_pagina", POR_PAGINA);
  return parametros.toString();
}

export default function Cursos() {
  const { api, panel } = useSesion();
  const administra = panel.opciones_habilitadas.includes("anios_lectivos");
  const [anios, setAnios] = useState(null);
  const [filtro, setFiltro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [respuesta, setRespuesta] = useState(null);
  const [creado, setCreado] = useState(null);
  const [formulario, setFormulario] = useState({
    anio_lectivo_id: "",
    nombre: "",
    turno: "",
  });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [edicion, setEdicion] = useState(null);
  const [errorDeEdicion, setErrorDeEdicion] = useState(null);

  const consulta = consultaDe(filtro, pagina);

  useEffect(() => {
    if (!administra) return undefined;
    let vigente = true;
    api
      .get("/anios-lectivos?pagina=1&por_pagina=100")
      .then((datos) => vigente && setAnios(datos.datos))
      .catch(() => vigente && setAnios([]));
    return () => {
      vigente = false;
    };
  }, [api, administra]);

  useEffect(() => {
    let vigente = true;
    api
      .get(`/cursos?${consulta}`)
      .then((datos) => vigente && setRespuesta({ consulta, ...datos }))
      .catch(
        (fallo) =>
          vigente && setRespuesta({ consulta, error: mensajeDeError(fallo) }),
      );
    return () => {
      vigente = false;
    };
  }, [api, consulta]);

  async function crear(evento) {
    evento.preventDefault();
    setError(null);
    setCreado(null);
    setEnviando(true);
    try {
      const curso = await api.post("/cursos", formulario);
      setRespuesta((previa) => ({
        ...previa,
        datos: [...previa.datos, curso],
        total: previa.total + 1,
      }));
      setCreado(curso.nombre);
      setFormulario({ ...formulario, nombre: "", turno: "" });
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setEnviando(false);
    }
  }

  async function guardar(evento) {
    evento.preventDefault();
    setErrorDeEdicion(null);
    try {
      const curso = await api.patch(`/cursos/${edicion.id}`, {
        nombre: edicion.nombre,
        turno: edicion.turno,
      });
      setRespuesta((previa) => ({
        ...previa,
        datos: previa.datos.map((c) => (c.id === curso.id ? curso : c)),
      }));
      setEdicion(null);
    } catch (fallo) {
      setErrorDeEdicion(mensajeDeError(fallo));
    }
  }

  const cargando = respuesta?.consulta !== consulta;
  const opcionesDeAnio = (anios ?? []).map((a) => ({
    valor: a.id,
    etiqueta: `${a.anio}`,
  }));

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Cursos</h2>

      {administra && anios && (
        <Selector
          etiqueta="Filtrar por año lectivo"
          valor={filtro}
          opciones={[{ valor: "", etiqueta: "Todos" }, ...opcionesDeAnio]}
          alCambiar={(valor) => {
            setFiltro(valor);
            setPagina(1);
          }}
        />
      )}

      {cargando && <p role="status">Cargando…</p>}
      {!cargando && respuesta.error && <Alerta mensaje={respuesta.error} />}
      {!cargando && respuesta.datos?.length === 0 && (
        <p className="mb-6 text-slate-700">Todavía no hay cursos.</p>
      )}
      {!cargando && respuesta.datos?.length > 0 && (
        <ul
          aria-label="Cursos"
          className="mb-4 divide-y divide-slate-200 border-y border-slate-200"
        >
          {respuesta.datos.map((curso) => (
            <li key={curso.id} className="py-3">
              {edicion?.id === curso.id ? (
                <form onSubmit={guardar} className="max-w-md">
                  <Alerta mensaje={errorDeEdicion} />
                  <Campo
                    etiqueta="Nuevo nombre"
                    valor={edicion.nombre}
                    alCambiar={(nombre) => setEdicion({ ...edicion, nombre })}
                  />
                  <Campo
                    etiqueta="Nuevo turno"
                    valor={edicion.turno}
                    alCambiar={(turno) => setEdicion({ ...edicion, turno })}
                  />
                  <div className="flex gap-3">
                    <div className="w-44">
                      <Boton>Guardar cambios</Boton>
                    </div>
                    <button
                      type="button"
                      className="rounded border border-slate-300 px-4 py-2"
                      onClick={() => setEdicion(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0">
                    <span className="font-medium text-slate-900">
                      {curso.nombre}
                    </span>
                    <p className="text-sm text-slate-600">
                      {`${curso.turno} · ${ESTADOS[curso.estado]} · ${curso.alumnos_vinculados} ${curso.alumnos_vinculados === 1 ? "alumno vinculado" : "alumnos vinculados"}`}
                    </p>
                  </div>
                  {administra && (
                    <button
                      type="button"
                      aria-label={`Editar «${curso.nombre}»`}
                      className="rounded border border-slate-300 px-3 py-1 text-sm"
                      onClick={() => {
                        setErrorDeEdicion(null);
                        setEdicion({
                          id: curso.id,
                          nombre: curso.nombre,
                          turno: curso.turno,
                        });
                      }}
                    >
                      Editar
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {!cargando && respuesta.datos && (
        <Paginacion
          pagina={pagina}
          porPagina={POR_PAGINA}
          total={respuesta.total}
          alCambiar={setPagina}
        />
      )}

      {administra && anios && (
        <form
          onSubmit={crear}
          className="mt-8 max-w-md border-t border-slate-200 pt-6"
        >
          <h3 className="mb-2 font-medium text-slate-900">Crear un curso</h3>
          <Alerta mensaje={error} />
          {creado && (
            <p
              role="status"
              className="mb-3 text-sm text-slate-900"
            >{`Curso «${creado}» creado.`}</p>
          )}
          <Selector
            etiqueta="Año lectivo"
            valor={formulario.anio_lectivo_id}
            opciones={[{ valor: "", etiqueta: "Elegir…" }, ...opcionesDeAnio]}
            alCambiar={(anio_lectivo_id) =>
              setFormulario({ ...formulario, anio_lectivo_id })
            }
          />
          <Campo
            etiqueta="Nombre"
            valor={formulario.nombre}
            alCambiar={(nombre) => setFormulario({ ...formulario, nombre })}
          />
          <Campo
            etiqueta="Turno"
            valor={formulario.turno}
            alCambiar={(turno) => setFormulario({ ...formulario, turno })}
          />
          <Boton disabled={enviando}>Crear curso</Boton>
        </form>
      )}
    </section>
  );
}
