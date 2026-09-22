// RF-39 Bandeja de anuncios como vista de entrada · RF-22 Consulta del historial · RF-34 ·
// RF-35 · CU-09, CU-10 · RN-15, RN-32
// Prueba: CP-RF-39 · CP-RF-22 · CP-RF-34 · CP-RF-35
//
// RF-39 · vista inicial de los cuatro paneles. RF-22 · filtra por fecha, curso y remitente;
// los cursos salen del panel de la persona y los remitentes de los autores que el historial
// ya devolvió. RNF-16 · un anuncio anterior se localiza en tres pasos: la bandeja, el filtro
// y el detalle.
// Fig. 9 · el acuse lo emite el cliente al presentar el aviso dentro de la aplicación; RF-35
// · las vistas de lo que entra al área visible se emiten agrupadas. Sólo tutores y alumnos
// son destinatarios de un anuncio (Tabla 4): a quien no lo es no le corresponde ninguna
// entrega y no se emite nada. Es presentación, no autorización: la interfaz de programación
// resuelve quién puede qué.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { mensajeDeError } from "../comun/api.js";
import { useSesion } from "../comun/contextoSesion.js";
import {
  formatearFechaHora,
  instanteDeFinDeDia,
  instanteDeInicioDeDia,
} from "../comun/fechas.js";
import { Boton, Campo, Selector } from "../comun/formularios.jsx";
import Paginacion from "../comun/Paginacion.jsx";
import { useAcumuladorDeVistas } from "./useAcumuladorDeVistas.js";

const POR_PAGINA = 25;
const SIN_FILTROS = { curso: "", remitente: "", desde: "", hasta: "" };

function consultaDe(filtros, pagina) {
  const parametros = new URLSearchParams();
  if (filtros.curso) parametros.set("curso_id", filtros.curso);
  if (filtros.remitente) parametros.set("remitente_id", filtros.remitente);
  const desde = instanteDeInicioDeDia(filtros.desde);
  if (desde) parametros.set("desde", desde);
  const hasta = instanteDeFinDeDia(filtros.hasta);
  if (hasta) parametros.set("hasta", hasta);
  parametros.set("pagina", pagina);
  parametros.set("por_pagina", POR_PAGINA);
  return parametros.toString();
}

const nombreDe = (persona) => `${persona.nombre} ${persona.apellido}`;

export default function Bandeja() {
  const { panel, api } = useSesion();
  const destinatario = panel.rol === "tutor" || panel.rol === "alumno";

  const [formulario, setFormulario] = useState(SIN_FILTROS);
  const [aplicados, setAplicados] = useState(SIN_FILTROS);
  const [pagina, setPagina] = useState(1);
  const [respuesta, setRespuesta] = useState(null);
  const [remitentes, setRemitentes] = useState(() => new Map());

  const consulta = consultaDe(aplicados, pagina);

  useEffect(() => {
    let vigente = true;
    api
      .get(`/anuncios?${consulta}`)
      .then((datos) => {
        if (!vigente) return;
        setRespuesta({ consulta, ...datos });
        setRemitentes(
          (previos) =>
            new Map([
              ...previos,
              ...datos.datos.map((f) => [f.autor.id, nombreDe(f.autor)]),
            ]),
        );
      })
      .catch(
        (error) =>
          vigente && setRespuesta({ consulta, error: mensajeDeError(error) }),
      );
    return () => {
      vigente = false;
    };
  }, [api, consulta]);

  // Fig. 9 · presentar el aviso dentro de la aplicación es lo que dispara el acuse.
  useEffect(() => {
    if (!destinatario || !respuesta?.datos) return;
    const sinLeer = respuesta.datos
      .filter((fila) => !fila.leido)
      .map((fila) => fila.anuncio_version_id);
    if (sinLeer.length > 0)
      api
        .post("/entregas/acuses", { anuncio_version_ids: sinLeer })
        .catch(() => {});
  }, [api, destinatario, respuesta]);

  const emitirVistas = useCallback(
    (versiones) =>
      api
        .post("/entregas/vistas", { anuncio_version_ids: versiones })
        .catch(() => {}),
    [api],
  );
  const acumulador = useAcumuladorDeVistas(emitirVistas);

  function filtrar(evento) {
    evento.preventDefault();
    setAplicados(formulario);
    setPagina(1);
  }

  function limpiar() {
    setFormulario(SIN_FILTROS);
    setAplicados(SIN_FILTROS);
    setPagina(1);
  }

  const cargando = respuesta?.consulta !== consulta;
  const opcionesDeCurso = [
    { valor: "", etiqueta: "Todos" },
    ...panel.cursos.map((c) => ({ valor: c.id, etiqueta: c.nombre })),
  ];
  const opcionesDeRemitente = [
    { valor: "", etiqueta: "Todos" },
    ...[...remitentes].map(([id, nombre]) => ({ valor: id, etiqueta: nombre })),
  ];

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Anuncios</h2>

      <form
        onSubmit={filtrar}
        aria-label="Filtrar el historial"
        className="mb-6 grid gap-x-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Selector
          etiqueta="Curso"
          valor={formulario.curso}
          opciones={opcionesDeCurso}
          alCambiar={(curso) => setFormulario({ ...formulario, curso })}
        />
        <Selector
          etiqueta="Remitente"
          valor={formulario.remitente}
          opciones={opcionesDeRemitente}
          alCambiar={(remitente) => setFormulario({ ...formulario, remitente })}
        />
        <Campo
          etiqueta="Desde"
          tipo="date"
          valor={formulario.desde}
          alCambiar={(desde) => setFormulario({ ...formulario, desde })}
        />
        <Campo
          etiqueta="Hasta"
          tipo="date"
          valor={formulario.hasta}
          alCambiar={(hasta) => setFormulario({ ...formulario, hasta })}
        />
        <div className="flex gap-3 sm:col-span-2 lg:col-span-4">
          <div className="w-40">
            <Boton>Filtrar</Boton>
          </div>
          <button
            type="button"
            onClick={limpiar}
            className="rounded border border-slate-300 px-4 py-2"
          >
            Limpiar
          </button>
        </div>
      </form>

      {cargando && (
        <p role="status" className="text-slate-700">
          Cargando…
        </p>
      )}
      {!cargando && respuesta.error && (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {respuesta.error}
        </p>
      )}
      {!cargando && respuesta.datos?.length === 0 && (
        <p className="text-slate-700">
          No hay anuncios para los filtros elegidos.
        </p>
      )}
      {!cargando && respuesta.datos?.length > 0 && (
        <ul className="divide-y divide-slate-200 border-y border-slate-200">
          {respuesta.datos.map((fila) => (
            <li
              key={fila.id}
              ref={(nodo) => {
                if (destinatario)
                  acumulador.observar(nodo, fila.anuncio_version_id);
              }}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
            >
              <div className="min-w-0">
                <Link
                  to={`/anuncios/${fila.id}`}
                  state={{ autor: fila.autor }}
                  className="font-medium text-slate-900 underline"
                >
                  {fila.titulo}
                </Link>
                <p className="text-sm text-slate-600">
                  <span>{nombreDe(fila.autor)}</span> ·{" "}
                  <span>{formatearFechaHora(fila.publicado_en)}</span>
                </p>
              </div>
              {destinatario && !fila.leido && (
                <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
                  Sin leer
                </span>
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
    </section>
  );
}
