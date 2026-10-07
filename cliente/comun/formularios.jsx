// RF-40 Paneles diferenciados por rol · RF-01 Autenticación · CU-01, CU-09
// Prueba: CP-RF-40 · CP-RF-01
//
// Piezas de formulario comunes a todas las pantallas. Sólo clases utilitarias de Tailwind,
// con la paleta de fábrica: el punto 1.6 excluye diseñar un sistema propio. Toda entrada lleva
// su etiqueta —visible, o sólo para lectores de pantalla cuando la pantalla ya la hace
// evidente— y todo error se anuncia como alerta, que es la accesibilidad básica que se
// verifica por inspección.
import { useId } from "react";

const ETIQUETA = "block text-sm font-medium text-slate-700";

export function Campo({
  etiqueta,
  tipo = "text",
  valor,
  alCambiar,
  autoComplete,
}) {
  const id = useId();
  return (
    <div className="mb-4">
      <label htmlFor={id} className={ETIQUETA}>
        {etiqueta}
      </label>
      <input
        id={id}
        type={tipo}
        value={valor}
        autoComplete={autoComplete}
        onChange={(evento) => alCambiar(evento.target.value)}
        className="mt-1 block w-full rounded-lg border border-slate-500 bg-white px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-700"
      />
    </div>
  );
}

// `compacta` es la forma del redactor de la conversación: una fila que crece con el texto
// hasta un tope, sin margen inferior, para ir junto al botón de envío.
export function AreaDeTexto({
  etiqueta,
  valor,
  alCambiar,
  filas = 6,
  etiquetaOculta = false,
  compacta = false,
  alPresionarTecla,
}) {
  const id = useId();
  return (
    <div className={compacta ? "min-w-0 flex-1" : "mb-4"}>
      <label
        htmlFor={id}
        className={
          etiquetaOculta
            ? "sr-only"
            : "block text-sm font-medium text-slate-700"
        }
      >
        {etiqueta}
      </label>
      <textarea
        id={id}
        rows={filas}
        value={valor}
        onKeyDown={alPresionarTecla}
        onChange={(evento) => alCambiar(evento.target.value)}
        className={`block w-full border border-slate-500 bg-white text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-700 ${compacta ? "max-h-40 min-h-11 resize-none rounded-3xl px-4 py-2.5 field-sizing-content" : "mt-1 rounded-lg px-3 py-2"}`}
      />
    </div>
  );
}

export function Selector({ etiqueta, valor, alCambiar, opciones }) {
  const id = useId();
  return (
    <div className="mb-4">
      <label htmlFor={id} className={ETIQUETA}>
        {etiqueta}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(evento) => alCambiar(evento.target.value)}
        className="mt-1 block w-full rounded-lg border border-slate-500 bg-white px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-700"
      >
        {opciones.map(({ valor: v, etiqueta: e }) => (
          <option key={v} value={v}>
            {e}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Alerta({ mensaje }) {
  if (!mensaje) return null;
  return (
    <p
      role="alert"
      className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
    >
      {mensaje}
    </p>
  );
}

export function Boton({ children, ...resto }) {
  return (
    <button
      type="submit"
      className="w-full rounded-full bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-50"
      {...resto}
    >
      {children}
    </button>
  );
}

// Envoltorio de las pantallas previas a la sesión: ingreso, activación y sustitución.
export function PantallaDeAcceso({ titulo, children }) {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-stone-100 px-4 py-8 text-slate-900 [overflow-wrap:anywhere]">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-sm font-semibold text-emerald-800">
          Plataforma de comunicación escolar
        </h1>
        <h2 className="mb-6 text-2xl font-semibold text-slate-900">{titulo}</h2>
        {children}
      </div>
    </main>
  );
}
