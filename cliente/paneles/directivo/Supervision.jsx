// RF-45 Consulta directiva del estado de la comunicación · CU-15 · RN-15
// Prueba: CP-RF-45
//
// TC-06 (Tabla 17) · GET /supervision/cursos, del directivo: por curso, la cantidad de
// anuncios y de entregas enviadas, entregadas, vistas y leídas. Se presentan los conteos tal
// como la interfaz de programación los consigna: el cliente no calcula porcentajes ni aplica
// umbrales. Sin parámetro la interfaz responde el año lectivo vigente (CU-15). Se presenta como
// tarjetas y no como tabla para no desbordar en los anchos angostos (RNF-18). RF-46
// (supervisión de conversaciones) es Should have: no se ofrece.
import { useEffect, useState } from "react";
import { mensajeDeError } from "../../comun/api.js";
import { useSesion } from "../../comun/contextoSesion.js";
import { Alerta, Selector } from "../../comun/formularios.jsx";

const COLUMNAS = [
  ["anuncios", "Anuncios"],
  ["enviadas", "Enviadas"],
  ["entregadas", "Entregadas"],
  ["vistas", "Vistas"],
  ["leidas", "Leídas"],
];

export default function Supervision() {
  const { api } = useSesion();
  const [anios, setAnios] = useState([]);
  const [anio, setAnio] = useState("");
  const [respuesta, setRespuesta] = useState(null);

  useEffect(() => {
    let vigente = true;
    api
      .get("/anios-lectivos?pagina=1&por_pagina=100")
      .then((datos) => vigente && setAnios(datos.datos))
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [api]);

  useEffect(() => {
    let vigente = true;
    api
      .get(
        anio
          ? `/supervision/cursos?anio_lectivo_id=${anio}`
          : "/supervision/cursos",
      )
      .then((datos) => vigente && setRespuesta({ anio, datos: datos.datos }))
      .catch(
        (fallo) =>
          vigente && setRespuesta({ anio, error: mensajeDeError(fallo) }),
      );
    return () => {
      vigente = false;
    };
  }, [api, anio]);

  const cargando = respuesta?.anio !== anio;
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Supervisión</h2>
      <div className="max-w-xs">
        <Selector
          etiqueta="Año lectivo"
          valor={anio}
          opciones={[
            { valor: "", etiqueta: "Año vigente" },
            ...anios.map((a) => ({ valor: a.id, etiqueta: `${a.anio}` })),
          ]}
          alCambiar={setAnio}
        />
      </div>
      {cargando && <p role="status">Cargando…</p>}
      {!cargando && respuesta.error && <Alerta mensaje={respuesta.error} />}
      {!cargando && respuesta.datos?.length === 0 && (
        <p className="text-slate-700">
          No hay cursos en el año lectivo elegido.
        </p>
      )}
      {!cargando &&
        respuesta.datos?.map(({ curso, ...conteos }) => (
          <section
            key={curso.id}
            aria-label={curso.nombre}
            className="mb-4 rounded border border-slate-200 p-4"
          >
            <h3 className="mb-3 font-medium text-slate-900">{curso.nombre}</h3>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {COLUMNAS.map(([clave, etiqueta]) => (
                <div key={clave}>
                  <dt className="text-xs text-slate-600">{etiqueta}</dt>
                  <dd className="text-lg font-semibold text-slate-900">
                    {conteos[clave]}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
    </section>
  );
}
