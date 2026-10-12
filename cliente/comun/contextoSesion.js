// RF-40 Paneles diferenciados por rol · RF-01 Autenticación · CU-01, CU-09 · RN-15
// Prueba: CP-RF-40 · CP-RF-01
import { createContext, useContext } from "react";

export const ContextoSesion = createContext(null);

export function useSesion() {
  const contexto = useContext(ContextoSesion);
  if (!contexto) throw new Error("useSesion se usa dentro de SesionProvider");
  return contexto;
}
