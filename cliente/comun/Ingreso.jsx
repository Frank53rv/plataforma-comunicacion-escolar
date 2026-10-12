// RF-01 Autenticación de usuarios · CU-01 · RN-09, RN-15
// Prueba: CP-RF-01
//
// CU-01 E1 · «un mensaje que no distingue cuál de los dos datos falló». El rechazo del
// ingreso presenta el mismo texto sea cual sea la causa: la interfaz de programación ya no
// las distingue y el cliente no lo reintroduce. RF-08 (recuperación de contraseña) es
// Should have: no se ofrece.
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { mensajeDeError } from "./api.js";
import { Alerta, Boton, Campo, PantallaDeAcceso } from "./formularios.jsx";
import { useSesion } from "./contextoSesion.js";

export default function Ingreso() {
  const { sesion, iniciar } = useSesion();
  const navegar = useNavigate();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(null);

  if (sesion) return <Navigate to="/" replace />;

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    try {
      await iniciar(correo, contrasena);
      navegar("/");
    } catch (fallo) {
      setError(
        fallo.estado === 401
          ? "Correo o contraseña incorrectos."
          : mensajeDeError(fallo),
      );
    }
  }

  return (
    <PantallaDeAcceso titulo="Ingresar">
      <form onSubmit={enviar}>
        <Alerta mensaje={error} />
        <Campo
          etiqueta="Correo"
          tipo="email"
          valor={correo}
          alCambiar={setCorreo}
          autoComplete="username"
        />
        <Campo
          etiqueta="Contraseña"
          tipo="password"
          valor={contrasena}
          alCambiar={setContrasena}
          autoComplete="current-password"
        />
        <Boton>Ingresar</Boton>
      </form>
      <Link to="/activar" className="mt-4 text-sm text-slate-700 underline">
        Activar cuenta con código de activación
      </Link>
    </PantallaDeAcceso>
  );
}
