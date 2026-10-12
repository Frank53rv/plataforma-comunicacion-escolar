// RF-25 Canal grupal del curso · RF-39 · CU-12, CU-09 · RN-23
// Prueba: CP-RF-25 · CP-RF-39
//
// Avatar de iniciales derivadas del nombre que la interfaz de programación ya devuelve: el de
// una persona o el de un curso. Es decorativo —el nombre se presenta como texto al lado— y por
// eso queda fuera del árbol de accesibilidad. El color sale de la semilla (un identificador),
// siempre el mismo para la misma semilla, y de tonos 700 de la paleta de fábrica, sobre los que
// el texto blanco supera el contraste 4,5:1. No hay fotos de perfil: el stack no almacena
// archivos.
const COLORES = [
  "bg-emerald-700",
  "bg-teal-700",
  "bg-sky-700",
  "bg-indigo-700",
  "bg-rose-700",
  "bg-amber-700",
  "bg-fuchsia-700",
  "bg-cyan-700",
];

function inicialesDe(nombre) {
  const terminos = nombre.trim().split(/\s+/).filter(Boolean);
  if (terminos.length === 0) return "";
  const extremos =
    terminos.length === 1 ? terminos : [terminos[0], terminos.at(-1)];
  return extremos.map((t) => t[0].toLocaleUpperCase("es")).join("");
}

function colorDe(semilla) {
  let suma = 0;
  for (const caracter of String(semilla)) suma += caracter.codePointAt(0);
  return COLORES[suma % COLORES.length];
}

export default function Iniciales({ nombre, semilla, chico = false }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${chico ? "size-8 text-xs" : "size-10 text-sm"} ${colorDe(semilla)}`}
    >
      {inicialesDe(nombre)}
    </span>
  );
}
