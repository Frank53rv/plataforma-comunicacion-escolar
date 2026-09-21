// RF-25 Canal grupal del curso · RF-28 Persistencia e historial de mensajes · RF-29 ·
// CU-12 · RN-23, RN-27
// Prueba: CP-RF-25 · CP-RF-28 · CP-RF-29
//
// TC-14 y TC-19 (Tabla 17) · un canal grupal: su historial, el envío de mensajes y la llegada
// en vivo por WSS (Figura 8). Los mensajes se presentan del más antiguo al más reciente; los
// anteriores se piden de a una página. Un mensaje puede llegar por el historial, por el
// canal y por la respuesta del envío: se presenta una vez (RN-27). Nada se guarda en el
// navegador. RF-30 (adjuntos) y RF-47 (no leídos) son Should have: no se ofrecen.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { mensajeDeError } from "../comun/api.js";
import { useSesion } from "../comun/contextoSesion.js";
import { formatearFechaHora } from "../comun/fechas.js";
import { AreaDeTexto, Boton } from "../comun/formularios.jsx";
import { conectarCanal } from "./canalEnVivo.js";
import { unirMensajes } from "./mensajes.js";

const POR_PAGINA = 25;

const TEXTOS_DE_ESTADO = {
  conectando: "Conectando…",
  vivo: "En vivo",
  sin_conexion:
    "Sin conexión en tiempo real. Los mensajes se ven al reconectar.",
};

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

  useEffect(() => {
    fin.current?.scrollIntoView?.({ block: "end" });
  }, [mensajes.length]);

  const cargarAnteriores = useCallback(async () => {
    try {
      const siguiente = paginaCargada + 1;
      const datos = await api.get(
        `/conversaciones/${id}/mensajes?pagina=${siguiente}&por_pagina=${POR_PAGINA}`,
      );
      setMensajes((previos) => unirMensajes(previos, datos.datos));
      setPaginaCargada(siguiente);
    } catch (fallo) {
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

  const cargando = paginaCargada === 0 && !error;
  const hayAnteriores =
    paginaCargada > 0 && paginaCargada < Math.ceil(total / POR_PAGINA);
  const alerta = error || errorDeEnvio;

  return (
    <section>
      <Link
        to="/conversaciones"
        className="mb-4 inline-block text-sm text-slate-700 underline"
      >
        Volver a los canales
      </Link>
      <h2 className="mb-1 text-xl font-semibold text-slate-900">
        {curso ? `Canal grupal · ${curso}` : "Canal grupal"}
      </h2>
      <p role="status" className="mb-4 text-sm text-slate-600">
        {TEXTOS_DE_ESTADO[estadoDelCanal]}
      </p>

      {alerta && (
        <p
          role="alert"
          className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {alerta}
        </p>
      )}
      {cargando && <p role="status">Cargando…</p>}
      {hayAnteriores && (
        <button
          type="button"
          onClick={cargarAnteriores}
          className="mb-3 rounded border border-slate-300 px-3 py-1 text-sm"
        >
          Ver mensajes anteriores
        </button>
      )}
      {paginaCargada > 0 && mensajes.length === 0 && (
        <p className="text-slate-700">Todavía no hay mensajes.</p>
      )}
      {mensajes.length > 0 && (
        <ul aria-label="Mensajes" className="mb-4 space-y-3">
          {mensajes.map((mensaje) => {
            const propio = mensaje.autor.id === sesion.usuario_id;
            return (
              <li
                key={mensaje.id}
                className={`max-w-prose rounded border px-3 py-2 ${propio ? "ml-auto border-slate-900 bg-slate-50" : "border-slate-200"}`}
              >
                <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-slate-600">
                  <span className="font-medium text-slate-900">{`${mensaje.autor.nombre} ${mensaje.autor.apellido}`}</span>
                  {propio && <span>Propio</span>}
                  <span>{formatearFechaHora(mensaje.enviado_en)}</span>
                </p>
                <p className="whitespace-pre-wrap text-slate-900">
                  {mensaje.cuerpo}
                </p>
              </li>
            );
          })}
        </ul>
      )}
      <div ref={fin} />

      <form onSubmit={enviar} className="max-w-prose">
        <AreaDeTexto
          etiqueta="Mensaje"
          valor={borrador}
          alCambiar={setBorrador}
          filas={3}
        />
        <div className="w-40">
          <Boton disabled={enviando}>Enviar</Boton>
        </div>
      </form>
    </section>
  );
}
