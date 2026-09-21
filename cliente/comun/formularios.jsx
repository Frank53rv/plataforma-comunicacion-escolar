// RF-40 Paneles diferenciados por rol · RF-01 Autenticación · CU-01, CU-09
// Prueba: CP-RF-40 · CP-RF-01
//
// Piezas de formulario comunes a todas las pantallas. Sólo clases utilitarias de Tailwind:
// el punto 1.6 excluye diseñar un sistema propio. Toda entrada lleva su etiqueta y todo
// error se anuncia como alerta, que es la accesibilidad básica que se verifica por inspección.
import { useId } from "react";

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
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      <input
        id={id}
        type={tipo}
        value={valor}
        autoComplete={autoComplete}
        onChange={(evento) => alCambiar(evento.target.value)}
        className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 focus:outline-2 focus:outline-slate-900"
      />
    </div>
  );
}

export function AreaDeTexto({ etiqueta, valor, alCambiar, filas = 6 }) {
  const id = useId();
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      <textarea
        id={id}
        rows={filas}
        value={valor}
        onChange={(evento) => alCambiar(evento.target.value)}
        className="mt-1 block w-full rounded border border-slate-300 px-3 py-2 focus:outline-2 focus:outline-slate-900"
      />
    </div>
  );
}

export function Selector({ etiqueta, valor, alCambiar, opciones }) {
  const id = useId();
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(evento) => alCambiar(evento.target.value)}
        className="mt-1 block w-full rounded border border-slate-300 bg-white px-3 py-2 focus:outline-2 focus:outline-slate-900"
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
      className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
    >
      {mensaje}
    </p>
  );
}

export function Boton({ children, ...resto }) {
  return (
    <button
      type="submit"
      className="w-full rounded bg-slate-900 px-4 py-2 font-medium text-white focus:outline-2 focus:outline-offset-2 focus:outline-slate-900 disabled:opacity-50"
      {...resto}
    >
      {children}
    </button>
  );
}

// Envoltorio de las pantallas previas a la sesión: ingreso, activación y sustitución.
export function PantallaDeAcceso({ titulo, children }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
      <h1 className="mb-1 text-sm font-medium text-slate-600">
        Plataforma de comunicación escolar
      </h1>
      <h2 className="mb-6 text-2xl font-semibold text-slate-900">{titulo}</h2>
      {children}
    </main>
  );
}
