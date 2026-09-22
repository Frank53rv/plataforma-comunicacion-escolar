// RF-35 Registro agrupado de vistas · CU-10 · RN-32
// Prueba: CP-RF-35
import { useEffect, useMemo } from "react";
import { AcumuladorDeVistas } from "./acumuladorDeVistas.js";

export function useAcumuladorDeVistas(emitir) {
  const acumulador = useMemo(
    () => new AcumuladorDeVistas({ emitir }),
    [emitir],
  );
  useEffect(() => () => acumulador.cerrar(), [acumulador]);
  return acumulador;
}
