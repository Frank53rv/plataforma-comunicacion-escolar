// RF-43 Sustitución de la credencial provisional · CU-01, CU-02 · RN-08, RN-09
// Prueba: CP-RF-43
//
// RN-09 · «Toda credencial provisional debe cambiarse en el primer acceso; hasta entonces
// ninguna otra operación se habilita.» Es la única pantalla a la que lleva una cuenta con
// credencial provisional. La decisión de que la credencial es provisional es de la interfaz
// de programación: el cliente sólo la presenta.
import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { mensajeDeError } from "./api.js";
import { Alerta, Boton, Campo, PantallaDeAcceso } from "./formularios.jsx";
import { useSesion } from "./contextoSesion.js";

export default function SustitucionDeCredencial() {
  const { sesion, sustituirCredencial } = useSesion();
  const navegar = useNavigate();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [error, setError] = useState(null);

  if (!sesion) return <Navigate to="/ingreso" replace />;
  if (!sesion.credencial_provisional) return <Navigate to="/" replace />;

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    try {
      await sustituirCredencial(actual, nueva);
      navegar("/");
    } catch (fallo) {
      setError(
        fallo.estado === 401
          ? "La contraseña actual no es correcta."
          : mensajeDeError(fallo),
      );
    }
  }

  return (
    <PantallaDeAcceso titulo="Sustituir la credencial provisional">
      <p className="mb-4 text-sm text-slate-700">
        La credencial provisional debe sustituirse en el primer acceso. Hasta
        entonces no se habilita ninguna otra operación.
      </p>
      <form onSubmit={enviar}>
        <Alerta mensaje={error} />
        <Campo
          etiqueta="Contraseña actual"
          tipo="password"
          valor={actual}
          alCambiar={setActual}
          autoComplete="current-password"
        />
        <Campo
          etiqueta="Contraseña nueva"
          tipo="password"
          valor={nueva}
          alCambiar={setNueva}
          autoComplete="new-password"
        />
        <Boton>Sustituir credencial</Boton>
      </form>
    </PantallaDeAcceso>
  );
}
