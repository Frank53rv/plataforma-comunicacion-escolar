// RF-20 Borrado lógico de anuncios · RF-23 · CU-08, CU-11 · RN-21
// Prueba: CP-RF-20 · CP-RF-23
//
// TC-12 (Tabla 17) · eliminar un anuncio propio ya publicado. RNF-14 (Tabla 11) · «Toda
// acción destructiva —baja de persona, eliminación de anuncio— exige confirmación
// explícita.» Estas acciones se dibujan sólo en los anuncios de la persona; quién puede
// eliminar y quién consultar la constancia lo resuelve la interfaz de programación (403 a
// quien no es el autor), no el cliente.
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { mensajeDeError } from "../../comun/api.js";
import { useSesion } from "../../comun/contextoSesion.js";
import { Alerta } from "../../comun/formularios.jsx";

export default function AccionesDelAutor({ anuncio }) {
  const { api } = useSesion();
  const navegar = useNavigate();
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState(null);

  async function eliminar() {
    setError(null);
    setEliminando(true);
    try {
      await api.delete(`/anuncios/${anuncio.id}`);
      navegar("/");
    } catch (fallo) {
      setError(mensajeDeError(fallo));
      setConfirmando(false);
      setEliminando(false);
    }
  }

  const boton = "rounded border border-slate-300 px-3 py-1 text-sm";
  return (
    <div className="mb-4">
      <Alerta mensaje={error} />
      <div className="flex flex-wrap items-center gap-3">
        <Link to={`/anuncios/${anuncio.id}/constancias`} className={boton}>
          Constancias
        </Link>
        {!confirmando && (
          <button
            type="button"
            className={boton}
            onClick={() => setConfirmando(true)}
          >
            Eliminar anuncio
          </button>
        )}
      </div>
      {confirmando && (
        <div
          role="alertdialog"
          aria-label="Confirmar la eliminación"
          className="mt-3 rounded border border-red-300 bg-red-50 p-3"
        >
          <p className="mb-3 text-sm text-red-900">
            ¿Eliminar este anuncio? Deja de mostrarse en el historial y no se
            puede deshacer.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={eliminando}
              onClick={eliminar}
              className="rounded bg-red-700 px-3 py-1 text-sm text-white disabled:opacity-50"
            >
              Confirmar eliminación
            </button>
            <button
              type="button"
              disabled={eliminando}
              className={boton}
              onClick={() => setConfirmando(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
