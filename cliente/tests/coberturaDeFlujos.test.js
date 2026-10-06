// RF-42 Cobertura de flujos en interfaz · CU-09 · RN-15, RNF-21
// Prueba: CP-RF-42
//
// RF-42 (Tabla 10) · «La totalidad de los flujos comprometidos debe poder ejecutarse desde el
// cliente web, sin recurrir a herramientas de composición de peticiones.» Tabla 16 · métrica:
// «cobertura de flujos ejecutables desde la interfaz», umbral 100 %.
//
// Se lee el código del cliente y se comprueba, en los dos sentidos, contra las operaciones de
// la Tabla 18 (specs/20-endpoints.json): (1) cada operación comprometida y construida tiene al
// menos una llamada en el cliente, y (2) el cliente no llama a ninguna operación fuera de la
// tabla —ni a las Should have, que no se construyen—. Es una comprobación estática: prueba que
// cada flujo tiene su pantalla y su llamada, no que la pantalla se vea bien; eso lo verifica la
// sesión de validación. Toda llamada a la interfaz debe llevar su ruta como literal en el primer
// argumento, para que esta lectura la vea.
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

// Operaciones comprometidas (Must have) que la interfaz de programación todavía no construye.
// PATCH /anuncios/{id} lo comparten RF-19 (Should have) y RF-21; la decisión del autor es no
// construirla. Sin ruta en la interfaz, el cliente no puede llamarla.
const NO_CONSTRUIDAS = new Set(["PATCH /anuncios/{x}"]);

const normalizar = (ruta) =>
  ruta
    .replace(/^\/api\/v1/, "")
    .replace(/\$\{[^}]*\}/g, "{x}")
    .replace(/\{[^}/]+\}/g, "{x}")
    .replace(/\?.*$/, "");

function archivos(carpeta) {
  return fs.readdirSync(carpeta, { withFileTypes: true }).flatMap((e) => {
    const ruta = path.join(carpeta, e.name);
    if (e.isDirectory()) return e.name === "publico" ? [] : archivos(ruta);
    return /\.(js|jsx)$/.test(e.name) ? [ruta] : [];
  });
}

// Los literales de texto del primer argumento de `api.<método>(…)`, con las expresiones de las
// plantillas ya reducidas a `${…}`.
function llamadasA(fuente) {
  const llamadas = [];
  const patron = /\bapi\s*\.\s*(get|post|put|patch|delete)\s*\(/g;
  let coincidencia;
  while ((coincidencia = patron.exec(fuente))) {
    let i = patron.lastIndex;
    let profundidad = 0;
    const literales = [];
    while (i < fuente.length) {
      const c = fuente[i];
      if (c === '"' || c === "'" || c === "`") {
        let j = i + 1;
        let texto = "";
        let llaves = 0;
        while (j < fuente.length) {
          if (fuente[j] === "\\") {
            texto += fuente[j + 1];
            j += 2;
            continue;
          }
          if (c === "`" && fuente[j] === "$" && fuente[j + 1] === "{") {
            llaves = 1;
            j += 2;
            while (llaves > 0) {
              if (fuente[j] === "{") llaves += 1;
              if (fuente[j] === "}") llaves -= 1;
              j += 1;
            }
            texto += "${x}";
            continue;
          }
          if (fuente[j] === c) break;
          texto += fuente[j];
          j += 1;
        }
        literales.push(texto);
        i = j + 1;
        continue;
      }
      if ("([{".includes(c)) profundidad += 1;
      if (")]}".includes(c)) {
        if (profundidad === 0) break;
        profundidad -= 1;
      }
      if (c === "," && profundidad === 0) break;
      i += 1;
    }
    literales
      .filter((l) => l.startsWith("/"))
      .forEach((l) =>
        llamadas.push(`${coincidencia[1].toUpperCase()} ${normalizar(l)}`),
      );
  }
  return llamadas;
}

const fuentes = CARPETAS.flatMap((c) => archivos(path.join(RAIZ, c))).map((f) =>
  fs.readFileSync(f, "utf8"),
);
const llamadasDelCliente = new Set(fuentes.flatMap(llamadasA));
if (fuentes.some((f) => /createConsumer\(\s*`\/cable/.test(f)))
  llamadasDelCliente.add("WSS /cable");

const inventario = JSON.parse(
  fs.readFileSync(
    path.resolve(RAIZ, "..", "specs", "20-endpoints.json"),
    "utf8",
  ),
);
const clave = (op) => `${op.metodo} ${normalizar(op.ruta)}`;
const comprometidas = inventario.endpoints
  .filter((op) => !op.should)
  .map(clave);
const construidas = comprometidas.filter((c) => !NO_CONSTRUIDAS.has(c));
const todas = new Set(inventario.endpoints.map(clave));

describe("CP-RF-42 · cobertura de flujos ejecutables desde la interfaz", () => {
  it("lee las operaciones de la Tabla 18 y las llamadas del cliente, y ninguna de las dos lecturas está vacía", () => {
    expect(inventario.endpoints).toHaveLength(42);
    expect(construidas).toHaveLength(37);
    expect(llamadasDelCliente.size).toBeGreaterThan(30);
  });

  it("cada operación comprometida y construida tiene su llamada en el cliente: 100 %", () => {
    const sinPantalla = construidas.filter(
      (operacion) => !llamadasDelCliente.has(operacion),
    );

    expect(sinPantalla).toEqual([]);
  });

  it("el cliente no llama a ninguna operación que la Tabla 18 no declare", () => {
    const desconocidas = [...llamadasDelCliente].filter(
      (llamada) => !todas.has(llamada),
    );

    expect(desconocidas).toEqual([]);
  });

  it("el cliente no llama a las operaciones Should have, que no se construyen (Boundary 1)", () => {
    const should = inventario.endpoints.filter((op) => op.should).map(clave);

    expect(
      should.filter((operacion) => llamadasDelCliente.has(operacion)),
    ).toEqual([]);
  });

  it("las cinco Should have y la que no se construye son exactamente las que quedan fuera", () => {
    const fuera = inventario.endpoints
      .map(clave)
      .filter((operacion) => !llamadasDelCliente.has(operacion));

    expect(fuera.sort()).toEqual(
      [
        "PATCH /anios-lectivos/{x}",
        "POST /conversaciones/{x}/adjuntos",
        "POST /recuperaciones",
        "PUT /conversaciones/{x}/puntero-lectura",
        "GET /supervision/conversaciones",
      ].sort(),
    );
  });
});
