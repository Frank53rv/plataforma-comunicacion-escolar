// RF-37 Degradación ante fallo de entrega · CU-14 · RNF-11, RNF-14
// Prueba: CP-RF-37
//
// Registra o da de baja el identificador de destino del navegador (POST y DELETE
// /suscripciones-push, los cuatro roles). Si el navegador no puede recibir avisos, la
// persona lo sabe y los avisos siguen llegando dentro de la aplicación (RNF-11).
// La interfaz de programación no tiene una consulta de suscripciones: para invalidar la de
// este navegador se registra de nuevo su identificador —la operación devuelve la misma
// suscripción vigente— y se obtiene así el id que la baja necesita. RNF-14 · darla de baja
// pide confirmación explícita.
import { useEffect, useState } from "react";
import { mensajeDeError } from "../comun/api.js";
import { useSesion } from "../comun/contextoSesion.js";
import {
  admiteAvisos,
  nombreDelNavegador,
  obtenerIdentificadorDeDestino,
} from "./avisosPush.js";

const RESPALDO = "Los avisos se presentan dentro de la aplicación.";
const TEXTOS_DE_CAUSA = {
  permiso_denegado: "El navegador no concedió el permiso para mostrar avisos.",
  sin_configuracion: "Los avisos en este dispositivo no están configurados.",
  sin_soporte: "Este navegador no admite avisos.",
  servicio_no_disponible: "El servicio de avisos no está disponible.",
};

function textoDe(fallo) {
  return TEXTOS_DE_CAUSA[fallo.causa]
    ? `${TEXTOS_DE_CAUSA[fallo.causa]} ${RESPALDO}`
    : mensajeDeError(fallo);
}

export default function AvisosEnEsteDispositivo() {
  const { api } = useSesion();
  const [soporte, setSoporte] = useState(null);
  const [trabajando, setTrabajando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    let vigente = true;
    admiteAvisos().then((admite) => vigente && setSoporte(admite));
    return () => {
      vigente = false;
    };
  }, []);

  async function registrar() {
    const token = await obtenerIdentificadorDeDestino();
    return api.post("/suscripciones-push", {
      token,
      navegador: nombreDelNavegador(),
    });
  }

  async function ejecutar(accion, exito) {
    setError(null);
    setResultado(null);
    setTrabajando(true);
    try {
      await accion();
      setResultado(exito);
    } catch (fallo) {
      setError(textoDe(fallo));
    } finally {
      setTrabajando(false);
      setConfirmando(false);
    }
  }

  const activar = () =>
    ejecutar(registrar, "Avisos activados en este dispositivo.");
  const desactivar = () =>
    ejecutar(async () => {
      const suscripcion = await registrar();
      await api.delete(`/suscripciones-push/${suscripcion.id}`);
    }, "Avisos desactivados en este dispositivo.");

  const boton = "rounded border border-slate-300 px-4 py-2 disabled:opacity-50";
  return (
    <section
      aria-labelledby="titulo-avisos"
      className="mt-8 max-w-2xl border-t border-slate-200 pt-6"
    >
      <h3
        id="titulo-avisos"
        className="mb-2 text-lg font-semibold text-slate-900"
      >
        Avisos en este dispositivo
      </h3>
      {soporte === false && (
        <p className="text-sm text-slate-700">
          Este navegador no admite avisos. {RESPALDO}
        </p>
      )}
      {soporte && (
        <>
          <p className="mb-3 text-sm text-slate-700">
            Activar permite recibir avisos aunque la aplicación esté cerrada.
            Sin ellos, los avisos se presentan dentro de la aplicación.
          </p>
          {error && (
            <p
              role="alert"
              className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {error}
            </p>
          )}
          {resultado && (
            <p role="status" className="mb-3 text-sm text-slate-900">
              {resultado}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={boton}
              disabled={trabajando}
              onClick={activar}
            >
              Activar avisos
            </button>
            {!confirmando && (
              <button
                type="button"
                className={boton}
                disabled={trabajando}
                onClick={() => setConfirmando(true)}
              >
                Desactivar avisos
              </button>
            )}
          </div>
          {confirmando && (
            <div
              role="alertdialog"
              aria-label="Confirmar la desactivación"
              className="mt-3 rounded border border-red-300 bg-red-50 p-3"
            >
              <p className="mb-3 text-sm text-red-900">
                ¿Desactivar los avisos en este dispositivo? Los avisos se
                presentarán sólo dentro de la aplicación.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={trabajando}
                  onClick={desactivar}
                  className="rounded bg-red-700 px-3 py-1 text-sm text-white disabled:opacity-50"
                >
                  Confirmar desactivación
                </button>
                <button
                  type="button"
                  disabled={trabajando}
                  className={boton}
                  onClick={() => setConfirmando(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
