// RF-11 Gestión del año lectivo · CU-03 · RN-31
// Prueba: CP-RF-11
//
// TC-02 (Tabla 17) · abrir el año lectivo. RN-31 · existe un solo año lectivo vigente: abrir
// otro con uno vigente responde 409 con la regla consignada, y se presenta tal cual. RF-16
// (cerrar el año lectivo) es Should have: no se ofrece.
import { useEffect, useState } from "react";
import { mensajeDeError } from "../../comun/api.js";
import { useSesion } from "../../comun/contextoSesion.js";
import { formatearFecha } from "../../comun/fechas.js";
import { Alerta, Boton, Campo } from "../../comun/formularios.jsx";

const ESTADOS = { vigente: "Vigente", cerrado: "Cerrado" };

export default function AniosLectivos() {
  const { api } = useSesion();
  const [anios, setAnios] = useState(null);
  const [errorDeCarga, setErrorDeCarga] = useState(null);
  const [anio, setAnio] = useState("");
  const [error, setError] = useState(null);
  const [abierto, setAbierto] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let vigente = true;
    api
      .get("/anios-lectivos?pagina=1&por_pagina=100")
      .then((datos) => vigente && setAnios(datos.datos))
      .catch((fallo) => vigente && setErrorDeCarga(mensajeDeError(fallo)));
    return () => {
      vigente = false;
    };
  }, [api]);

  async function abrir(evento) {
    evento.preventDefault();
    setError(null);
    setAbierto(null);
    setEnviando(true);
    try {
      const nuevo = await api.post("/anios-lectivos", {
        anio: anio === "" ? undefined : Number(anio),
      });
      setAnios((previos) => [...previos, nuevo]);
      setAbierto(nuevo.anio);
      setAnio("");
    } catch (fallo) {
      setError(mensajeDeError(fallo));
    } finally {
      setEnviando(false);
    }
  }

  if (errorDeCarga) return <Alerta mensaje={errorDeCarga} />;
  if (!anios) return <p role="status">Cargando…</p>;

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-slate-900">
        Años lectivos
      </h2>
      {anios.length === 0 ? (
        <p className="mb-6 text-slate-700">Todavía no hay años lectivos.</p>
      ) : (
        <ul
          aria-label="Años lectivos"
          className="mb-6 divide-y divide-slate-200 border-y border-slate-200"
        >
          {anios.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-baseline gap-x-3 py-2"
            >
              <span className="font-medium text-slate-900">{a.anio}</span>
              <span className="text-sm text-slate-700">
                {ESTADOS[a.estado]}
              </span>
              <span className="text-sm text-slate-600">{`abierto el ${formatearFecha(a.abierto_en)}`}</span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={abrir} className="max-w-sm">
        <h3 className="mb-2 font-medium text-slate-900">
          Abrir un año lectivo
        </h3>
        <Alerta mensaje={error} />
        {abierto && (
          <p
            role="status"
            className="mb-3 text-sm text-slate-900"
          >{`Año lectivo ${abierto} abierto.`}</p>
        )}
        <Campo etiqueta="Año" tipo="number" valor={anio} alCambiar={setAnio} />
        <Boton disabled={enviando}>Abrir año lectivo</Boton>
      </form>
    </section>
  );
}
