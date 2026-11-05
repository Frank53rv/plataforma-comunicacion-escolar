import { chromium } from "playwright-core";
import fs from "node:fs";
const BASE = "http://localhost:8090";
const cuentas = JSON.parse(fs.readFileSync("cuentas.json", "utf8"));
const ANCHOS = [320, 360, 768, 1280];
const api = async (ruta, { metodo = "GET", token, cuerpo } = {}) => {
  const r = await fetch(`${BASE}/api/v1${ruta}`, { method: metodo, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  return r.json().catch(() => null);
};
const ingreso = async (correo) => api("/sesiones", { metodo: "POST", cuerpo: { correo, contrasena: "prueba-2026" } });

// rutas por rol, con ids reales
const sesiones = {};
for (const [rol, correo] of Object.entries(cuentas)) sesiones[rol] = await ingreso(correo);
const t = (rol) => sesiones[rol].token;
const anuncioDelDocente = (await api(`/anuncios?remitente_id=${sesiones.docente.usuario.id}&pagina=1&por_pagina=1`, { token: t("docente") })).datos[0].id;
const anuncioTutor = (await api("/anuncios?pagina=1&por_pagina=1", { token: t("tutor") })).datos[0].id;
const convDocente = (await api("/conversaciones?pagina=1&por_pagina=25", { token: t("docente") })).datos[0];
const convTutor = (await api("/conversaciones?pagina=1&por_pagina=25", { token: t("tutor") })).datos[0];

const RUTAS = {
  directivo: ["/", "/preferencias", "/supervision", "/anios-lectivos", "/cursos", "/docentes", "/alumnos"],
  docente: ["/", "/publicar", "/constancias", "/conversaciones", `/conversaciones/${convDocente.id}`, `/cursos/${convDocente.curso_id}/canal`, "/preferencias", "/cursos", "/alumnos", `/anuncios/${anuncioDelDocente}`, `/anuncios/${anuncioDelDocente}/constancias`],
  tutor: ["/", "/conversaciones", `/conversaciones/${convTutor.id}`, "/preferencias", `/anuncios/${anuncioTutor}`],
  alumno: ["/", "/preferencias"],
};

const b = await chromium.launch();
const resultados = [];
for (const ancho of ANCHOS) {
  for (const [rol, rutas] of Object.entries(RUTAS)) {
    const ctx = await b.newContext({ viewport: { width: ancho, height: 800 } });
    const s = sesiones[rol];
    await ctx.addInitScript(([tok, exp, id]) => sessionStorage.setItem("sesion", JSON.stringify({ token: tok, vence_en: exp, credencial_provisional: false, usuario_id: id })), [s.token, s.vence_en, s.usuario.id]);
    for (const ruta of rutas) {
      const p = await ctx.newPage();
      const errores = [];
      p.on("pageerror", (e) => errores.push(e.message.slice(0, 120)));
      p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errores.push(m.text().slice(0, 120)));
      await p.goto(BASE + ruta, { waitUntil: "networkidle" });
      await p.waitForTimeout(300);
      const medida = await p.evaluate(() => {
        const ancho = window.innerWidth;
        let peor = null;
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > ancho + 1 && (!peor || r.right > peor.right)) peor = { etiqueta: el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : ""), right: Math.round(r.right), texto: (el.textContent || "").slice(0, 40) };
        }
        return { desborde: document.documentElement.scrollWidth - ancho, peor, texto: document.body.innerText.length };
      });
      const nombre = `${rol}-${ruta.replace(/[^a-z0-9]+/gi, "_").slice(0, 30)}-${ancho}`;
      if (ancho === 360 || medida.desborde > 0) await p.screenshot({ path: `capturas/${nombre}.png`, fullPage: true });
      resultados.push({ ancho, rol, ruta: ruta.replace(/[0-9a-f-]{36}/g, "{id}"), desborde: medida.desborde, peor: medida.peor, vacia: medida.texto < 30, errores });
      await p.close();
    }
    await ctx.close();
  }
}
await b.close();
fs.writeFileSync("resultados.json", JSON.stringify(resultados, null, 1));
const malos = resultados.filter((r) => r.desborde > 0 || r.vacia || r.errores.length);
console.log(`pantallas medidas: ${resultados.length} (${ANCHOS.join("/")} px)`);
console.log(`con desplazamiento horizontal: ${resultados.filter((r) => r.desborde > 0).length} · vacías: ${resultados.filter((r) => r.vacia).length} · con errores de consola: ${resultados.filter((r) => r.errores.length).length}`);
malos.forEach((r) => console.log(JSON.stringify(r)));
