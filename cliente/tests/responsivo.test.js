// RF-41 Interfaz responsiva · CU-09 · RNF-18
// Prueba: CP-RF-41
//
// RF-41 (Tabla 10) · «El cliente debe ser operable desde navegador en dispositivos de escritorio
// y móviles, en los anchos de referencia de 360 px, 768 px y 1280 px.» RNF-18 · «no presenta
// desplazamiento horizontal a partir de 320 px».
//
// LÍMITE DE ESTAS PRUEBAS: jsdom no tiene motor de maquetado, así que no puede medir un ancho ni
// detectar un desplazamiento. Estas son GUARDAS ESTÁTICAS contra las causas conocidas de
// desborde. La verificación de RNF-18 es la pasada de las 24 tareas de la Tabla 17 en los tres
// anchos, que es el instrumento que la Tabla 37 le asigna (sesión de validación).
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

function archivos(carpeta) {
  return fs.readdirSync(carpeta, { withFileTypes: true }).flatMap((e) => {
    const ruta = path.join(carpeta, e.name);
    if (e.isDirectory()) return archivos(ruta);
    return /\.jsx$/.test(e.name) ? [ruta] : [];
  });
}

const jsx = CARPETAS.flatMap((c) => archivos(path.join(RAIZ, c))).map(
  (ruta) => ({
    ruta: path.relative(RAIZ, ruta),
    fuente: fs.readFileSync(ruta, "utf8"),
  }),
);
const clases = jsx.flatMap(({ ruta, fuente }) =>
  [...fuente.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)].flatMap((m) =>
    (m[1] ?? m[2])
      .split(/\s+/)
      .filter(Boolean)
      .map((clase) => ({ ruta, clase })),
  ),
);

describe("CP-RF-41 · guardas contra el desborde horizontal", () => {
  it("lee el código del cliente y sus clases", () => {
    expect(jsx.length).toBeGreaterThan(20);
    expect(clases.length).toBeGreaterThan(300);
  });

  it("la página declara la ventana de visualización, sin la cual un teléfono la presenta a escritorio", () => {
    const html = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8");

    expect(html).toMatch(/<meta[^>]+name="viewport"[^>]+width=device-width/);
  });

  it("ninguna clase fija un ancho mayor que 320 px sin un punto de corte que lo condicione", () => {
    const anchos = clases
      .filter(({ clase }) => !clase.includes(":"))
      .map(({ ruta, clase }) => {
        const px = clase.match(/^(?:min-)?w-\[(\d+)px\]$/)?.[1];
        const paso = clase.match(/^(?:min-)?w-(\d+)$/)?.[1];
        return {
          ruta,
          clase,
          px: px ? Number(px) : paso ? Number(paso) * 4 : 0,
        };
      })
      .filter(({ px }) => px > 320);

    expect(anchos).toEqual([]);
  });

  it("nada obliga a no cortar el texto ni a desplazarse horizontalmente", () => {
    const prohibidas = clases.filter(({ clase }) =>
      /^(whitespace-nowrap|overflow-x-(scroll|auto)|overflow-scroll)$/.test(
        clase.replace(/^[a-z]+:/, ""),
      ),
    );

    expect(prohibidas).toEqual([]);
  });

  it("no hay tablas: las cifras se presentan como tarjetas que se acomodan al ancho", () => {
    expect(
      jsx
        .filter(({ fuente }) => /<table[\s>]/.test(fuente))
        .map(({ ruta }) => ruta),
    ).toEqual([]);
  });

  // El texto que escriben las personas —cuerpo de un anuncio, mensajes— usa whitespace-pre-wrap,
  // que sólo corta en los espacios: una dirección larga o una palabra sin espacios ensancharía la
  // página. `overflow-wrap` se hereda, así que basta con declararlo en la raíz de cada pantalla.
  it.each([
    ["comun/Armazon.jsx", "la raíz del panel"],
    ["comun/formularios.jsx", "las pantallas de acceso"],
  ])("%s corta las palabras largas (%s)", (archivo) => {
    const fuente = jsx.find(({ ruta }) => ruta === archivo).fuente;

    expect(fuente).toContain("[overflow-wrap:anywhere]");
  });

  it("los elementos que crecen dentro de un contenedor flexible pueden encogerse (min-w-0)", () => {
    const armazon = jsx.find(({ ruta }) => ruta === "comun/Armazon.jsx").fuente;

    expect(armazon).toMatch(/min-w-0 flex-1/);
  });

  it("la navegación se recoge detrás de un botón en pantallas angostas y no oculta ninguna opción", () => {
    const armazon = jsx.find(({ ruta }) => ruta === "comun/Armazon.jsx").fuente;

    expect(armazon).toContain("md:hidden");
    expect(armazon).toMatch(/aria-expanded/);
  });
});
