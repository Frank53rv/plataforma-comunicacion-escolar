// RF-12 Gestión de cursos · CU-03, CU-04, CU-05 · RN-15
// Prueba: CP-RF-12
//
// Los cursos con su nómina (docentes, y alumnos con sus tutores), que GET /cursos devuelve a
// quienes administran personas. La Tabla 18 no tiene una operación que lea personas: éste es
// el único origen de los identificadores que las operaciones de alta, baja, vinculación y
// regeneración del código de activación necesitan. Al directivo le llega además la totalidad
// de los docentes de la institución, que la nómina de los cursos no alcanza mientras no estén
// vinculados. Al recargar se conserva lo ya presentado hasta que llegue lo nuevo. Nada se
// guarda en el navegador (RN-28).
import { useCallback, useEffect, useState } from "react";
import { mensajeDeError } from "./api.js";
import { useSesion } from "./contextoSesion.js";

export function useCursosConNomina() {
  const { api } = useSesion();
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    let vigente = true;
    api
      .get("/cursos?pagina=1&por_pagina=100")
      .then(
        (datos) =>
          vigente &&
          setResultado({
            cursos: datos.datos,
            docentes: datos.docentes_de_la_institucion ?? [],
          }),
      )
      .catch(
        (fallo) => vigente && setResultado({ error: mensajeDeError(fallo) }),
      );
    return () => {
      vigente = false;
    };
  }, [api, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return {
    cursos: resultado?.cursos,
    docentes: resultado?.docentes,
    error: resultado?.error,
    cargando: !resultado,
    recargar,
  };
}
