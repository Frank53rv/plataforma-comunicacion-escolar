// RF-06 Activación de cuenta · CU-02 · RN-06, RN-09
// Prueba: CP-RF-06
//
// Tabla 24 · 410: «código de activación vencido, ya utilizado o inexistente». La cuenta
// activada define su contraseña propia, de modo que entra con la credencial ya definitiva.
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { mensajeDeError } from "./api.js";
import { Alerta, Boton, Campo, PantallaDeAcceso } from "./formularios.jsx";
import { useSesion } from "./contextoSesion.js";

export default function Activacion() {
  const { activar } = useSesion();
  const navegar = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(null);

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    try {
      await activar(codigo, contrasena);
      navegar("/");
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    }
  }

  return (
    <PantallaDeAcceso titulo="Activar cuenta">
      <form onSubmit={enviar}>
        <Alerta mensaje={error} />
        <Campo
          etiqueta="Código de activación"
          valor={codigo}
          alCambiar={setCodigo}
          autoComplete="one-time-code"
        />
        <Campo
          etiqueta="Contraseña"
          tipo="password"
          valor={contrasena}
          alCambiar={setContrasena}
          autoComplete="new-password"
        />
        <Boton>Activar cuenta</Boton>
      </form>
      <Link to="/ingreso" className="mt-4 text-sm text-slate-700 underline">
        Volver a ingresar
      </Link>
    </PantallaDeAcceso>
  );
}
