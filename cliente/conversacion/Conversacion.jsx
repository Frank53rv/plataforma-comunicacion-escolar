// RF-25 Canal grupal del curso · RF-28 Persistencia e historial de mensajes · RF-29 ·
// CU-12 · RN-23, RN-27
// Prueba: CP-RF-25 · CP-RF-28 · CP-RF-29
//
// TC-14 y TC-19 (Tabla 17) · un canal grupal: su historial, el envío de mensajes y la llegada
// en vivo por WSS (Figura 8). Los mensajes se presentan del más antiguo al más reciente; los
// anteriores se piden de a una página. Un mensaje puede llegar por el historial, por el
// canal y por la respuesta del envío: se presenta una vez (RN-27). Nada se guarda en el
// navegador. RF-30 (adjuntos) y RF-47 (no leídos) son Should have: no se ofrecen.
//
// Se presenta a pantalla completa: barra con la vuelta y el estado de la conexión, historial
// como único elemento que desplaza, burbujas agrupadas por autor y redactor fijo abajo. Enter
// envía sólo donde hay un puntero fino; en pantallas táctiles agrega una línea y envía el
// botón. La hora de cada burbuja conserva la fecha completa en la zona de Asunción.
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useParams } from "react-router";
import { mensajeDeError } from "../comun/api.js";
import { useSesion } from "../comun/contextoSesion.js";
import { formatearFechaHora } from "../comun/fechas.js";
import { Alerta, AreaDeTexto } from "../comun/formularios.jsx";
import Iniciales from "../comun/Iniciales.jsx";
import { conectarCanal } from "./canalEnVivo.js";
import { unirMensajes } from "./mensajes.js";

const POR_PAGINA = 25;

const TEXTOS_DE_ESTADO = {
  conectando: "Conectando…",
  vivo: "En vivo",
  sin_conexion:
    "Sin conexión en tiempo real. Los mensajes se ven al reconectar.",
};

// En escritorio Enter envía y Mayús+Enter agrega una línea; en un teclado táctil no hay
// Mayús+Enter a mano, así que Enter agrega la línea y envía el botón.
const conPunteroFino = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(pointer: fine)").matches;

// Con `key`, cada conversación empieza de cero: no hay estado que reiniciar a mano.
export default function Conversacion() {
  const { id } = useParams();
  return <CanalAbierto key={id} id={id} />;
}

function CanalAbierto({ id }) {
  const { api, sesion } = useSesion();
  const curso = useLocation().state?.curso;
  const [mensajes, setMensajes] = useState([]);
  const [total, setTotal] = useState(0);
  const [paginaCargada, setPaginaCargada] = useState(0);
  const [error, setError] = useState(null);
  const [estadoDelCanal, setEstadoDelCanal] = useState("conectando");
  const [reconexiones, setReconexiones] = useState(0);
  const [borrador, setBorrador] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorDeEnvio, setErrorDeEnvio] = useState(null);
  const huboDesconexion = useRef(false);
  const fin = useRef(null);
  const historial = useRef(null);
  const distanciaAlFinal = useRef(null);

  // La primera página, y de nuevo tras cada reconexión: lo que llegó mientras no había canal
  // está en la base de datos, que es la fuente de verdad (RN-27).
  useEffect(() => {
    let vigente = true;
    api
      .get(`/conversaciones/${id}/mensajes?pagina=1&por_pagina=${POR_PAGINA}`)
      .then((datos) => {
        if (!vigente) return;
        setMensajes((previos) => unirMensajes(previos, datos.datos));
        setTotal(datos.total);
        setPaginaCargada((previa) => Math.max(previa, 1));
        setError(null);
      })
      .catch((fallo) => vigente && setError(mensajeDeError(fallo)));
    return () => {
      vigente = false;
    };
  }, [api, id, reconexiones]);

  useEffect(
    () =>
      conectarCanal({
        token: sesion.token,
        conversacionId: id,
        alRecibir: (mensaje) =>
          setMensajes((previos) => unirMensajes(previos, [mensaje])),
        alConectar: () => {
          setEstadoDelCanal("vivo");
          if (huboDesconexion.current) {
            huboDesconexion.current = false;
            setReconexiones((n) => n + 1);
          }
        },
        alDesconectar: () => {
          huboDesconexion.current = true;
          setEstadoDelCanal("sin_conexion");
        },
        alRechazar: () => setError(mensajeDeError({ estado: 403 })),
      }),
    [sesion.token, id],
  );

  // Al final sólo cuando cambia el último mensaje: los anteriores se agregan arriba y no
  // deben llevar al final.
  const ultimoId = mensajes.at(-1)?.id;
  useEffect(() => {
    fin.current?.scrollIntoView?.({ block: "end" });
  }, [ultimoId]);

  // Tras agregar los anteriores, la misma distancia al final que antes: lo que se estaba
  // leyendo queda en su lugar.
  useLayoutEffect(() => {
    const nodo = historial.current;
    if (distanciaAlFinal.current === null || !nodo) return;
    nodo.scrollTop = nodo.scrollHeight - distanciaAlFinal.current;
    distanciaAlFinal.current = null;
  }, [mensajes]);

  const cargarAnteriores = useCallback(async () => {
    const nodo = historial.current;
    distanciaAlFinal.current = nodo.scrollHeight - nodo.scrollTop;
    try {
      const siguiente = paginaCargada + 1;
      const datos = await api.get(
        `/conversaciones/${id}/mensajes?pagina=${siguiente}&por_pagina=${POR_PAGINA}`,
      );
      setMensajes((previos) => unirMensajes(previos, datos.datos));
      setPaginaCargada(siguiente);
    } catch (fallo) {
      distanciaAlFinal.current = null;
      setError(mensajeDeError(fallo));
    }
  }, [api, id, paginaCargada]);

  async function enviar(evento) {
    evento.preventDefault();
    const cuerpo = borrador.trim();
    if (!cuerpo) return;
    setErrorDeEnvio(null);
    setEnviando(true);
    try {
      const mensaje = await api.post(`/conversaciones/${id}/mensajes`, {
        cuerpo,
      });
      setMensajes((previos) => unirMensajes(previos, [mensaje]));
      setBorrador("");
    } catch (fallo) {
      setErrorDeEnvio(mensajeDeError(fallo));
    } finally {
      setEnviando(false);
    }
  }

  function alPresionarTecla(evento) {
    if (evento.key !== "Enter" || evento.shiftKey) return;
    if (evento.nativeEvent.isComposing || !conPunteroFino()) return;
    evento.preventDefault();
    evento.currentTarget.form.requestSubmit();
  }

  const cargando = paginaCargada === 0 && !error;
  const hayAnteriores =
    paginaCargada > 0 && paginaCargada < Math.ceil(total / POR_PAGINA);
  const alerta = error || errorDeEnvio;
  const titulo = curso ? `Canal grupal · ${curso}` : "Canal grupal";

  return (
    <section className="flex h-full flex-col bg-stone-100 transition duration-200 starting:translate-x-4 starting:opacity-0 motion-reduce:transition-none">
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2 py-2">
        <Link
          to="/conversaciones"
          className="rounded-full p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-rol-700"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-6 stroke-current"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="sr-only">Volver a los canales</span>
        </Link>
        <Iniciales nombre={curso ?? "Canal grupal"} semilla={curso ?? id} />
        <div className="min-w-0">
          <h2 className="line-clamp-1 font-semibold break-words text-slate-900">
            {titulo}
          </h2>
          <p role="status" className="text-xs text-slate-600">
            {TEXTOS_DE_ESTADO[estadoDelCanal]}
          </p>
        </div>
      </div>

      {alerta && (
        <div className="shrink-0 px-3 pt-3">
          <Alerta mensaje={alerta} />
        </div>
      )}
      <div
        ref={historial}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3 md:px-6"
      >
        {cargando && (
          <p role="status" className="text-center text-slate-700">
            Cargando…
          </p>
        )}
        {hayAnteriores && (
          <button
            type="button"
            onClick={cargarAnteriores}
            className="mx-auto mb-3 block rounded-full bg-white px-3 py-1 text-sm text-slate-800 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-rol-700"
          >
            Ver mensajes anteriores
          </button>
        )}
        {paginaCargada > 0 && mensajes.length === 0 && (
          <p className="mx-auto w-fit rounded-full bg-white px-3 py-1 text-sm text-slate-700 shadow-sm">
            Todavía no hay mensajes.
          </p>
        )}
        {mensajes.length > 0 && (
          <ul aria-label="Mensajes" className="flex flex-col">
            {mensajes.map((mensaje, i) => {
              const propio = mensaje.autor.id === sesion.usuario_id;
              const docente = mensaje.autor.rol === "docente";
              const inicio = mensajes[i - 1]?.autor.id !== mensaje.autor.id;
              const nombre = `${mensaje.autor.nombre} ${mensaje.autor.apellido}`;
              return (
                <li
                  key={mensaje.id}
                  className={`flex max-w-[85%] items-start gap-2 md:max-w-[70%] ${propio ? "self-end" : "self-start"} ${inicio ? "mt-3 first:mt-0" : "mt-0.5"}`}
                >
                  {!propio &&
                    (inicio ? (
                      <Iniciales
                        nombre={nombre}
                        semilla={mensaje.autor.id}
                        chico
                      />
                    ) : (
                      <span aria-hidden="true" className="w-8 shrink-0" />
                    ))}
                  <div
                    className={`relative min-w-0 rounded-2xl px-3 py-1.5 shadow-sm ${propio ? "bg-rol-100" : "bg-white"} ${inicio && propio ? "rounded-tr-none before:absolute before:top-0 before:-right-2 before:border-t-[10px] before:border-r-[10px] before:border-t-rol-100 before:border-r-transparent" : ""} ${inicio && !propio ? "rounded-tl-none before:absolute before:top-0 before:-left-2 before:border-t-[10px] before:border-l-[10px] before:border-t-white before:border-l-transparent" : ""}`}
                  >
                    {(!propio || docente) && (
                      <p
                        className={`flex flex-wrap items-baseline gap-x-2 text-xs font-semibold ${inicio ? "" : "sr-only"}`}
                      >
                        {propio ? (
                          <span className="sr-only">Propio</span>
                        ) : (
                          <span
                            className={
                              docente ? "text-indigo-700" : "text-slate-900"
                            }
                          >
                            {nombre}
                          </span>
                        )}
                        {docente && (
                          <span className="rounded bg-indigo-100 px-1.5 text-[11px] text-indigo-800">
                            Docente
                          </span>
                        )}
                      </p>
                    )}
                    {propio && !docente && (
                      <span className="sr-only">Propio</span>
                    )}
                    <p className="whitespace-pre-wrap break-words text-slate-900">
                      {mensaje.cuerpo}
                    </p>
                    <p className="text-right text-[11px] text-slate-600">
                      {formatearFechaHora(mensaje.enviado_en)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={fin} />
      </div>

      <form
        onSubmit={enviar}
        className="flex shrink-0 items-end gap-2 border-t border-slate-200 bg-stone-50 p-2"
      >
        <AreaDeTexto
          etiqueta="Mensaje"
          valor={borrador}
          alCambiar={setBorrador}
          filas={1}
          etiquetaOculta
          compacta
          alPresionarTecla={alPresionarTecla}
        />
        <button
          type="submit"
          disabled={enviando}
          aria-label="Enviar"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-rol-700 text-white hover:bg-rol-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rol-700 disabled:opacity-50"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5 fill-current"
          >
            <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" />
          </svg>
        </button>
      </form>
    </section>
  );
}
