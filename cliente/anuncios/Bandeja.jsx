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
import { Alerta, Boton, Campo, Selector } from "../comun/formularios.jsx";
import Iniciales from "../comun/Iniciales.jsx";
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
  const conFiltros = Object.values(aplicados).some(Boolean);
  const puedePublicar = panel.opciones_habilitadas.includes("publicar_anuncio");
  const orientacion = conFiltros
    ? "Probar con otros filtros muestra más anuncios."
    : puedePublicar
      ? "Los anuncios que publiques aparecerán acá."
      : destinatario
        ? "Los anuncios que publiquen los docentes de tu curso aparecerán acá."
        : "Los anuncios que publiquen los docentes aparecerán acá.";

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
    <section className="mx-auto max-w-4xl">
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Anuncios</h2>

      <form
        onSubmit={filtrar}
        aria-label="Filtrar el historial"
        className="mb-6 grid grid-cols-2 gap-x-2 rounded-2xl bg-white p-3 shadow-sm sm:gap-x-4 sm:p-4 lg:grid-cols-4"
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
        <div className="col-span-2 flex gap-3 lg:col-span-4">
          <div className="flex-1 sm:w-40 sm:flex-none">
            <Boton>Filtrar</Boton>
          </div>
          <button
            type="button"
            onClick={limpiar}
            className="min-h-11 flex-1 rounded-full sm:flex-none border border-slate-500 px-4 py-2 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rol-700"
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
      {!cargando && <Alerta mensaje={respuesta.error} />}
      {!cargando && respuesta.datos?.length === 0 && (
        <div className="space-y-2 rounded-2xl bg-white p-4 text-slate-700 shadow-sm">
          <p>No hay anuncios para los filtros elegidos.</p>
          <p>{orientacion}</p>
          {puedePublicar && !conFiltros && (
            <Link
              to="/publicar"
              className="inline-block rounded-full bg-rol-700 px-4 py-2 font-medium text-white hover:bg-rol-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rol-700"
            >
              Publicar un anuncio
            </Link>
          )}
        </div>
      )}
      {!cargando && respuesta.datos?.length > 0 && (
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white shadow-sm">
          {respuesta.datos.map((fila) => {
            const sinLeer = destinatario && !fila.leido;
            return (
              <li
                key={fila.id}
                ref={(nodo) => {
                  if (destinatario)
                    acumulador.observar(nodo, fila.anuncio_version_id);
                }}
                className="relative flex min-h-16 items-center gap-3 px-3 py-3 hover:bg-stone-50"
              >
                <Iniciales
                  nombre={nombreDe(fila.autor)}
                  semilla={fila.autor.id}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/anuncios/${fila.id}`}
                      state={{ autor: fila.autor }}
                      className={`line-clamp-2 break-words text-slate-900 after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-rol-700 ${sinLeer ? "font-semibold" : "font-normal"}`}
                    >
                      {fila.titulo}
                    </Link>
                    {sinLeer && (
                      <span className="shrink-0 rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-semibold text-white">
                        Sin leer
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">
                    <span>{nombreDe(fila.autor)}</span> ·{" "}
                    <span>{formatearFechaHora(fila.publicado_en)}</span>
                  </p>
                </div>
              </li>
            );
          })}
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
