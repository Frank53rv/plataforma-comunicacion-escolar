// Las 24 tareas críticas de la Tabla 17, por la interfaz, en un ancho de referencia.
import { chromium } from "playwright-core";
import fs from "node:fs";
import { execSync } from "node:child_process";

const ANCHO = Number(process.argv[2] || 360);
const BASE = "http://localhost:8090";
const cuentas = JSON.parse(fs.readFileSync("cuentas.json", "utf8"));
const N = `E2E${ANCHO}`;
const dominio = "e2e.test";
const CLAVE = "Prueba-e2e-2026";
const resultados = [];
const codigos = {};

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: ANCHO, height: 900 } });
const p = await ctx.newPage();
p.setDefaultTimeout(9000);
const errores = [];
p.on("pageerror", (e) => errores.push(e.message.slice(0, 100)));

const desborde = () => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const maxDesborde = { v: 0, donde: "" };
async function medir(donde) {
  const d = await desborde();
  if (d > maxDesborde.v) { maxDesborde.v = d; maxDesborde.donde = donde; }
}
async function tarea(cod, nombre, cuerpo) {
  try { await cuerpo(); await medir(cod); resultados.push({ cod, nombre, ok: true }); console.log("  ✓", cod); }
  catch (e) { await medir(cod).catch(() => {}); await p.screenshot({ path: `capturas/fallo-${cod}-${ANCHO}.png`, fullPage: true }).catch(() => {}); resultados.push({ cod, nombre, ok: false, error: String(e.message).split("\n")[0].slice(0, 160) }); console.log("  ✗", cod, String(e.message).split("\n")[0].slice(0, 140)); }
}
async function irA(etiqueta) {
  const volver = p.getByRole("link", { name: "Volver a los canales" }).or(p.getByRole("button", { name: "Volver a los canales" }));
  if (await volver.count() && await volver.first().isVisible()) await volver.first().click();
  const menu = p.getByRole("button", { name: "Menú" });
  if (await menu.isVisible()) await menu.click();
  await p.getByRole("navigation", { name: "Secciones" }).getByRole("link", { name: etiqueta, exact: true }).click();
}
async function ingresar(correo, clave) {
  await p.goto(BASE + "/ingreso");
  await p.getByLabel("Correo").fill(correo);
  await p.getByLabel("Contraseña").fill(clave);
  await p.getByRole("button", { name: "Ingresar", exact: true }).click();
}
async function salir() {
  try {
    await p.getByRole("button", { name: "Cerrar sesión", exact: true }).click({ timeout: 4000 });
    await p.getByRole("heading", { name: "Ingresar" }).waitFor({ timeout: 4000 });
  } catch {
    console.log("   (salir: la página no ofrecía «Cerrar sesión»; se limpia la sesión)");
    await p.evaluate(() => sessionStorage.clear());
    await p.goto(BASE + "/ingreso");
  }
}
async function codigoPresentado() {
  const t = await p.getByText(/Código de activación de .+: \S+/).first().textContent();
  return t.match(/: (\S+)$/)[1];
}
const cerrarCodigo = async () => { const b2 = p.getByRole("button", { name: "Entendido", exact: true }); if (await b2.count()) await b2.click(); };
const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Asuncion" });

// ---------- directivo ----------
const dir = `dir-${N.toLowerCase()}@${dominio}`;
execSync(`docker compose exec -T -e DIRECTIVO_CORREO=${dir} -e DIRECTIVO_CREDENCIAL_PROVISIONAL=Provisoria-1 api bin/rails directivo:reponer_credencial`, { stdio: "pipe", cwd: new URL("../..", import.meta.url).pathname });

await tarea("TC-01", "Primer acceso con la credencial provisional y sustitución", async () => {
  await ingresar(dir, "Provisoria-1");
  await p.getByRole("heading", { name: "Sustituir la credencial provisional" }).waitFor();
  await p.getByLabel("Contraseña actual").fill("Provisoria-1");
  await p.getByLabel("Contraseña nueva").fill(CLAVE);
  await p.getByRole("button", { name: "Sustituir credencial", exact: true }).click();
  await p.getByRole("heading", { name: "Anuncios" }).waitFor();
});
await tarea("TC-02", "Año lectivo (RN-31 lo impide si ya hay uno vigente) y curso", async () => {
  await irA("Años lectivos");
  await p.getByLabel("Año", { exact: true }).fill("2099");
  await p.getByRole("button", { name: "Abrir año lectivo", exact: true }).click();
  await p.getByRole("alert").filter({ hasText: "RN-31" }).waitFor();
  await medir("TC-02 error");
  await irA("Cursos");
  await p.getByLabel("Año lectivo", { exact: true }).selectOption({ label: "2026" });
  await p.getByLabel("Nombre", { exact: true }).fill(N);
  await p.getByLabel("Turno", { exact: true }).fill("mañana");
  await p.getByRole("button", { name: "Crear curso", exact: true }).click();
  await p.getByText(`Curso «${N}» creado.`).waitFor();
});
await tarea("TC-03", "Alta de un docente y asignación como titular", async () => {
  await irA("Docentes");
  await p.getByLabel("Nombre", { exact: true }).fill("Dora");
  await p.getByLabel("Apellido", { exact: true }).fill(N);
  await p.getByLabel("Correo", { exact: true }).fill(`dora-${N.toLowerCase()}@${dominio}`);
  await p.getByRole("button", { name: "Dar de alta", exact: true }).click();
  await p.getByText(/Código de activación de Dora/).waitFor();
  await medir("TC-03 código"); await cerrarCodigo();
  await p.getByLabel("Curso", { exact: true }).selectOption({ label: N });
  await p.getByLabel("Docente", { exact: true }).selectOption({ label: `Dora ${N}` });
  await p.getByLabel("Titular del curso").check();
  await p.getByRole("button", { name: "Vincular", exact: true }).click();
  await p.getByText(`Docente vinculado a «${N}».`).waitFor();
});
await tarea("TC-04", "Regenerar el código de activación de un docente", async () => {
  await p.getByRole("button", { name: `Regenerar el código de activación de «Dora ${N}»` }).click();
  codigos.dora = await codigoPresentado();
  await cerrarCodigo();
});
await tarea("TC-05", "Desvincular a un docente designando otro titular", async () => {
  await p.getByLabel("Nombre", { exact: true }).fill("Beto");
  await p.getByLabel("Apellido", { exact: true }).fill(N);
  await p.getByLabel("Correo", { exact: true }).fill(`beto-${N.toLowerCase()}@${dominio}`);
  await p.getByRole("button", { name: "Dar de alta", exact: true }).click();
  await p.getByText(/Código de activación de Beto/).waitFor(); await cerrarCodigo();
  await p.getByLabel("Curso", { exact: true }).selectOption({ label: N });
  await p.getByLabel("Docente", { exact: true }).selectOption({ label: `Beto ${N}` });
  await p.getByRole("button", { name: "Vincular", exact: true }).click();
  await p.getByText(`Docente vinculado a «${N}».`).waitFor();
  await p.getByRole("button", { name: `Desvincular a «Dora ${N}»` }).click();
  await p.getByLabel("Nuevo titular").selectOption({ label: `Beto ${N}` });
  await medir("TC-05 diálogo");
  await p.getByRole("button", { name: "Confirmar desvinculación", exact: true }).click();
  await p.getByText("Docente desvinculado.").waitFor();
  await p.getByRole("button", { name: "Conservar la cuenta", exact: true }).click();
});
await tarea("TC-06", "Estado agregado de entrega y lectura por curso", async () => {
  await irA("Supervisión");
  await p.getByText("Enviadas").first().waitFor();
});
await tarea("TC-07", "Horario de disponibilidad y preferencias (directivo)", async () => {
  await irA("Horario de disponibilidad");
  await p.getByLabel("Hasta").fill("20:00");
  await p.getByRole("button", { name: "Guardar", exact: true }).click();
  await p.getByText("Preferencias guardadas.").waitFor();
});
await salir();

// ---------- docente activa su cuenta (TC-08) ----------
await tarea("TC-08", "Activar la cuenta con el código de activación (docente)", async () => {
  await p.goto(BASE + "/activar");
  await p.getByLabel("Código de activación").fill(codigos.dora);
  await p.getByLabel("Contraseña").fill(CLAVE);
  await p.getByRole("button", { name: "Activar cuenta", exact: true }).click();
  await p.getByRole("heading", { name: "Anuncios" }).waitFor();
});
await salir();

// ---------- docente titular del conjunto ----------
await ingresar(cuentas.docente, "prueba-2026");
await p.getByRole("heading", { name: "Anuncios" }).waitFor();
async function altaAlumno(nom, ape, curso = "Primero A") {
  await irA("Alumnos y tutores");
  await p.getByLabel("Nombre", { exact: true }).fill(nom);
  await p.getByLabel("Apellido", { exact: true }).fill(ape);
  await p.getByLabel("Correo", { exact: true }).fill(`${nom.toLowerCase()}-${ape.toLowerCase()}@${dominio}`);
  await p.getByLabel("Curso", { exact: true }).selectOption({ label: curso });
  await p.getByRole("button", { name: "Dar de alta al alumno", exact: true }).click();
  await p.getByText(new RegExp(`Código de activación de ${nom} ${ape}`)).waitFor();
  const c = await codigoPresentado(); await cerrarCodigo();
  return c;
}
async function agregarTutor(alumno, nom, ape) {
  await p.getByRole("button", { name: `Agregar un tutor a «${alumno}»` }).click();
  await p.getByLabel("Nombre del tutor").fill(nom);
  await p.getByLabel("Apellido del tutor").fill(ape);
  await p.getByLabel("Correo del tutor").fill(`${nom.toLowerCase()}-${ape.toLowerCase()}@${dominio}`);
  await p.getByRole("button", { name: "Vincular tutor", exact: true }).click();
  await p.getByText(new RegExp(`Código de activación de ${nom} ${ape}`)).waitFor();
  const c = await codigoPresentado(); await cerrarCodigo();
  return c;
}
await tarea("TC-09", "Alta de un alumno, su curso y sus tutores", async () => {
  codigos.alumno = await altaAlumno("Ali", `${N}a`);
  codigos.tutor = await agregarTutor(`Ali ${N}a`, "Tino", `${N}a`);
  codigos.alumno2 = await altaAlumno("Bea", `${N}b`);
  await agregarTutor(`Bea ${N}b`, "Tita", `${N}b`);
});
await tarea("TC-10", "Baja de un alumno y de un tutor de su curso", async () => {
  await p.getByRole("button", { name: `Dar de baja a «Bea ${N}b»` }).click();
  await medir("TC-10 diálogo");
  await p.getByRole("button", { name: "Confirmar baja", exact: true }).click();
  await p.getByText("Alumno dado de baja.").waitFor();
  await p.getByRole("button", { name: `Dar de baja a «Tita ${N}b»` }).click();
  await p.getByRole("button", { name: "Confirmar baja", exact: true }).click();
  await p.getByText("Tutor dado de baja.").waitFor();
});
await tarea("TC-11", "Publicar un anuncio dirigido a un curso", async () => {
  await irA("Publicar un anuncio");
  await p.getByLabel("Título").fill(`Aviso ${N} A`);
  await p.getByLabel("Cuerpo").fill("Anuncio que se conserva.");
  await p.getByRole("checkbox", { name: "Primero A" }).check();
  await p.getByRole("button", { name: "Publicar", exact: true }).click();
  await p.getByText(/Anuncio publicado\. Destinatarios: \d+\./).waitFor();
  await p.getByRole("button", { name: "Publicar otro anuncio", exact: true }).click();
  await p.getByLabel("Título").fill(`Aviso ${N} B`);
  await p.getByLabel("Cuerpo").fill("Anuncio que se elimina.");
  await p.getByRole("checkbox", { name: "Primero A" }).check();
  await p.getByRole("button", { name: "Publicar", exact: true }).click();
  await p.getByText(/Anuncio publicado\./).waitFor();
});
await tarea("TC-13", "Constancias de lectura de un anuncio propio", async () => {
  await irA("Constancias");
  await p.getByRole("link", { name: `Constancia de «Aviso ${N} A»` }).click();
  await p.getByText(/destinatarios registraron lectura\./).waitFor();
});
await tarea("TC-12", "Eliminar un anuncio propio ya publicado", async () => {
  await irA("Constancias");
  await p.getByRole("link", { name: `Constancia de «Aviso ${N} B»` }).click();
  await p.getByRole("link", { name: "Volver al anuncio" }).click();
  await p.getByRole("button", { name: "Eliminar anuncio", exact: true }).click();
  await medir("TC-12 diálogo");
  await p.getByRole("button", { name: "Confirmar eliminación", exact: true }).click();
  await p.getByRole("heading", { name: "Anuncios" }).waitFor();
});
await tarea("TC-14", "Enviar un mensaje en el canal grupal del curso (docente)", async () => {
  await irA("Canal grupal");
  await p.getByRole("link", { name: /Canal grupal · Primero A/ }).click();
  await p.getByLabel("Mensaje").fill(`Mensaje del docente ${N}`);
  await p.getByRole("button", { name: "Enviar", exact: true }).click();
  await p.getByRole("list", { name: "Mensajes" }).getByText(`Mensaje del docente ${N}`).waitFor();
});
await salir();

// ---------- tutor ----------
await tarea("TC-15", "Activar la cuenta con el código (tutor)", async () => {
  await p.goto(BASE + "/activar");
  await p.getByLabel("Código de activación").fill(codigos.tutor);
  await p.getByLabel("Contraseña").fill(CLAVE);
  await p.getByRole("button", { name: "Activar cuenta", exact: true }).click();
  await p.getByRole("heading", { name: "Anuncios" }).waitFor();
});
await salir();
await tarea("TC-16", "Iniciar sesión y reconocer la bandeja como vista de entrada (tutor)", async () => {
  await ingresar(`tino-${N.toLowerCase()}a@${dominio}`, CLAVE);
  await p.getByRole("heading", { name: "Anuncios" }).waitFor();
  await p.getByRole("link", { name: `Aviso ${N} A` }).waitFor();
});
await tarea("TC-17", "Localizar un anuncio anterior con los filtros del historial", async () => {
  await p.getByLabel("Curso", { exact: true }).selectOption({ label: "Primero A" });
  await p.getByLabel("Desde").fill(hoy);
  await p.getByRole("button", { name: "Filtrar", exact: true }).click();
  await p.getByRole("link", { name: `Aviso ${N} A` }).waitFor();
});
await tarea("TC-18", "Abrir el detalle de un anuncio y registrar su lectura (tutor)", async () => {
  await p.getByRole("link", { name: `Aviso ${N} A` }).click();
  await p.getByRole("heading", { name: `Aviso ${N} A` }).waitFor();
  await p.getByRole("link", { name: "Volver a los anuncios" }).click();
  const fila = p.getByRole("listitem").filter({ hasText: `Aviso ${N} A` });
  await fila.waitFor();
  if (await fila.getByText("Sin leer").count()) throw new Error("la lectura no quedó registrada: sigue «Sin leer»");
});
await tarea("TC-19", "Enviar un mensaje en el canal grupal del curso (tutor)", async () => {
  await irA("Canal grupal");
  await p.getByRole("link", { name: /Canal grupal · Primero A/ }).click();
  await p.getByLabel("Mensaje").fill(`Mensaje del tutor ${N}`);
  await p.getByRole("button", { name: "Enviar", exact: true }).click();
  await p.getByRole("list", { name: "Mensajes" }).getByText(`Mensaje del tutor ${N}`).waitFor();
});
await tarea("TC-20", "Horario de disponibilidad y preferencias (tutor)", async () => {
  await irA("Horario de disponibilidad");
  await p.getByLabel("Desde").fill("07:00");
  await p.getByLabel("Hasta").fill("21:00");
  await p.getByRole("button", { name: "Guardar", exact: true }).click();
  await p.getByText("Preferencias guardadas.").waitFor();
});
await salir();

// ---------- alumno ----------
await tarea("TC-21", "Activar la cuenta con el código (alumno)", async () => {
  await p.goto(BASE + "/activar");
  await p.getByLabel("Código de activación").fill(codigos.alumno);
  await p.getByLabel("Contraseña").fill(CLAVE);
  await p.getByRole("button", { name: "Activar cuenta", exact: true }).click();
  await p.getByRole("heading", { name: "Anuncios" }).waitFor();
});
await tarea("TC-22", "Consultar los anuncios dirigidos a su curso (alumno)", async () => {
  await p.getByRole("link", { name: `Aviso ${N} A` }).waitFor();
  if (await p.getByRole("link", { name: "Canal grupal" }).count()) throw new Error("el alumno ve una opción de canal grupal");
});
await tarea("TC-23", "Abrir el detalle y registrar su lectura (alumno)", async () => {
  await p.getByRole("link", { name: `Aviso ${N} A` }).click();
  await p.getByRole("heading", { name: `Aviso ${N} A` }).waitFor();
  await p.getByRole("link", { name: "Volver a los anuncios" }).click();
  const fila = p.getByRole("listitem").filter({ hasText: `Aviso ${N} A` });
  await fila.waitFor();
  if (await fila.getByText("Sin leer").count()) throw new Error("la lectura no quedó registrada");
});
await tarea("TC-24", "Preferencias de recepción (alumno)", async () => {
  await irA("Horario de disponibilidad");
  await p.getByLabel("Recibir avisos de mensajes").uncheck();
  await p.getByRole("button", { name: "Guardar", exact: true }).click();
  await p.getByText("Preferencias guardadas.").waitFor();
});
await b.close();

const ok = resultados.filter((r) => r.ok).length;
console.log(`=== ${ANCHO} px · ${ok}/${resultados.length} tareas · desborde máximo ${maxDesborde.v}px${maxDesborde.v ? " en " + maxDesborde.donde : ""} · errores de página: ${errores.length}`);
resultados.filter((r) => !r.ok).forEach((r) => console.log(`  ✗ ${r.cod} ${r.nombre}: ${r.error}`));
fs.writeFileSync(`tareas-${ANCHO}.json`, JSON.stringify({ ancho: ANCHO, resultados, desborde: maxDesborde, errores }, null, 1));
