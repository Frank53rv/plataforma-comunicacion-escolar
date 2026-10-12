// RF-40 Paneles diferenciados por rol · RF-42 · CU-09 · RN-04
// Prueba: CP-RF-40 · CP-RF-42
//
// Tabla 26 · «Vocabulario de la interfaz de usuario · Vocabulario cerrado: anuncio,
// publicación, constancia, acuse, curso, año lectivo, código de activación, canal grupal y
// horario de disponibilidad. Se prohíben los sinónimos.» El parecido visual con otras
// aplicaciones no se traslada a las cadenas: se lee el código del cliente, sin comentarios, y
// se comprueba que ningún término ajeno al vocabulario aparece en él.
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(__dirname, "..");
const CARPETAS = [
  "comun",
  "anuncios",
  "paneles",
  "conversacion",
  "preferencias",
];
const AJENOS = /\b(chats?|mensajer[ií]a|grupos?|contactos?|whatsapp)\b/gi;

function archivos(carpeta) {
  return fs.readdirSync(carpeta, { withFileTypes: true }).flatMap((e) => {
    const ruta = path.join(carpeta, e.name);
    if (e.isDirectory()) return e.name === "publico" ? [] : archivos(ruta);
    return /\.(js|jsx)$/.test(e.name) ? [ruta] : [];
  });
}

const sinComentarios = (fuente) =>
  fuente.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const codigo = CARPETAS.flatMap((c) => archivos(path.join(RAIZ, c))).map(
  (ruta) => ({
    ruta: path.relative(RAIZ, ruta),
    fuente: sinComentarios(fs.readFileSync(ruta, "utf8")),
  }),
);

describe("CP-RF-40 · vocabulario cerrado de la interfaz (Tabla 26)", () => {
  it("lee el código del cliente", () => {
    expect(codigo.length).toBeGreaterThan(30);
  });

  it("descarta los comentarios antes de buscar", () => {
    expect(sinComentarios("a // chat\nb /* grupo */ c")).not.toMatch(AJENOS);
    expect(sinComentarios('"http://x"')).toBe('"http://x"');
  });

  it("ninguna cadena del cliente usa un término ajeno al vocabulario", () => {
    const hallazgos = codigo.flatMap(({ ruta, fuente }) =>
      [...fuente.matchAll(AJENOS)].map((m) => `${ruta}: ${m[0]}`),
    );

    expect(hallazgos).toEqual([]);
  });
});
