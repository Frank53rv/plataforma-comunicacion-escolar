// RF-40 Paneles diferenciados por rol · RF-01 Autenticación · RF-06 · RF-43 · CU-01, CU-02,
// CU-09 · RN-09, RN-15, RN-28
// Prueba: CP-RF-40 · CP-RF-01 · CP-RF-06 · CP-RF-43
//
// RN-28 · «La base de datos es la única fuente de verdad. El cliente no persiste historial
// en el navegador.» Lo único que se guarda, y sólo en `sessionStorage` (se pierde al cerrar
// la pestaña), es lo que hace falta para seguir autenticado: el token, su vencimiento y si
// la credencial sigue siendo provisional. El rol y el nombre se piden a GET /paneles/me
// cada vez, porque el cliente no decide qué corresponde a quién (RNF-21).
import { useCallback, useEffect, useMemo, useState } from "react";
import { crearApi, mensajeDeError } from "./api.js";
import { ContextoSesion } from "./contextoSesion.js";

const CLAVE = "sesion";

function leerGuardada() {
  try {
    const guardada = JSON.parse(sessionStorage.getItem(CLAVE));
    // RNF-02 · un token vencido equivale a no tener sesión, sin esperar el 401.
    if (guardada && new Date(guardada.vence_en) > new Date()) return guardada;
    sessionStorage.removeItem(CLAVE);
  } catch {
    sessionStorage.removeItem(CLAVE);
  }
  return null;
}

function guardar(sesion) {
  sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
}

export default function SesionProvider({ children }) {
  const [sesion, setSesion] = useState(leerGuardada);
  const [panel, setPanel] = useState(null);
  const [errorPanel, setErrorPanel] = useState(null);

  const cerrarLocal = useCallback(() => {
    sessionStorage.removeItem(CLAVE);
    setSesion(null);
    setPanel(null);
    setErrorPanel(null);
  }, []);

  const token = sesion?.token ?? null;
  const api = useMemo(
    () => crearApi({ obtenerToken: () => token, alNoAutenticado: cerrarLocal }),
    [token, cerrarLocal],
  );

  // RN-09 · con la credencial provisional ninguna otra operación se habilita: ni siquiera
  // el panel, que respondería 403. Se pide en cuanto la credencial es definitiva.
  useEffect(() => {
    if (!sesion || sesion.credencial_provisional || panel) return undefined;
    let vigente = true;
    api
      .get("/paneles/me")
      .then((datos) => vigente && setPanel(datos))
      .catch((error) => vigente && setErrorPanel(mensajeDeError(error)));
    return () => {
      vigente = false;
    };
  }, [sesion, panel, api]);

  const aceptar = useCallback((respuesta) => {
    const nueva = {
      token: respuesta.token,
      vence_en: respuesta.vence_en,
      credencial_provisional: respuesta.usuario.credencial_provisional,
      // Sólo para presentar («Eliminar» y «Constancias» en los anuncios propios): el
      // servidor responde 403 a quien no es el autor, sea cual sea lo que se dibuje.
      usuario_id: respuesta.usuario.id,
    };
    guardar(nueva);
    setSesion(nueva);
    setPanel(null);
    setErrorPanel(null);
  }, []);

  const valor = useMemo(
    () => ({
      sesion,
      panel,
      errorPanel,
      api,
      iniciar: async (correo, contrasena) =>
        aceptar(await api.post("/sesiones", { correo, contrasena })),
      activar: async (codigo, contrasena) =>
        aceptar(await api.post("/activaciones", { codigo, contrasena })),
      sustituirCredencial: async (actual, nueva) => {
        // Un 401 acá es la contraseña actual equivocada, no una sesión vencida.
        const usuario = await api.patch(
          "/usuarios/me/contrasena",
          { contrasena_actual: actual, contrasena_nueva: nueva },
          { conservarSesion: true },
        );
        const definitiva = {
          ...sesion,
          credencial_provisional: usuario.credencial_provisional,
        };
        guardar(definitiva);
        setSesion(definitiva);
      },
      // RNF-02 · cerrar la sesión es descartar el token; la interfaz sólo verifica la sesión.
      cerrar: async () => {
        try {
          await api.delete("/sesiones");
        } catch {
          // Aunque la interfaz no responda, el token se descarta.
        } finally {
          cerrarLocal();
        }
      },
    }),
    [sesion, panel, errorPanel, api, aceptar, cerrarLocal],
  );

  return (
    <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>
  );
}
