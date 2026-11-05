import { chromium } from "playwright-core";
import fs from "node:fs";
const BASE = "http://localhost:8090";
const cuentas = JSON.parse(fs.readFileSync("cuentas.json", "utf8"));
const api = async (ruta, { metodo = "GET", token, cuerpo } = {}) => (await fetch(`${BASE}/api/v1${ruta}`, { method: metodo, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: cuerpo ? JSON.stringify(cuerpo) : undefined })).json().catch(() => null);
const ses = async (rol) => api("/sesiones", { metodo: "POST", cuerpo: { correo: cuentas[rol], contrasena: "prueba-2026" } });
const b = await chromium.launch();
const contexto = async (rol, ancho) => {
  const s = await ses(rol);
  const c = await b.newContext({ viewport: { width: ancho, height: 800 } });
  await c.addInitScript(([tok, exp, id]) => sessionStorage.setItem("sesion", JSON.stringify({ token: tok, vence_en: exp, credencial_provisional: false, usuario_id: id })), [s.token, s.vence_en, s.usuario.id]);
  return { c, s };
};
const desborde = (p) => p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

// 1. el instrumento detecta un desborde
{
  const { c } = await contexto("tutor", 320);
  const p = await c.newPage();
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  const antes = await desborde(p);
  await p.evaluate(() => { const d = document.createElement("div"); d.style.cssText = "width:600px;height:10px"; document.body.appendChild(d); });
  console.log(`1. instrumento: sin inyectar ${antes}px · con un elemento de 600px → ${await desborde(p)}px (debe ser > 0)`);
  await c.close();
}

// 2. palabra larguísima sin espacios en un mensaje y en un anuncio
{
  const doc = await ses("docente");
  const conv = (await api("/conversaciones?pagina=1&por_pagina=25", { token: doc.token })).datos[0];
  const larga = "https://ejemplo.test/" + "x".repeat(260);
  await api(`/conversaciones/${conv.id}/mensajes`, { metodo: "POST", token: doc.token, cuerpo: { cuerpo: larga } });
  const curso = conv.curso_id;
  const an = await api("/anuncios", { metodo: "POST", token: doc.token, cuerpo: { titulo: "T".repeat(120), cuerpo: larga, cursos: [curso] } });
  for (const ancho of [320, 360]) {
    const { c } = await contexto("docente", ancho);
    for (const ruta of [`/conversaciones/${conv.id}`, `/anuncios/${an.id}`, "/"]) {
      const p = await c.newPage();
      await p.goto(BASE + ruta, { waitUntil: "networkidle" });
      console.log(`2. palabra larga · ${ancho}px · ${ruta.replace(/[0-9a-f-]{36}/g, "{id}")} → desborde ${await desborde(p)}px`);
      if (ancho === 320) await p.screenshot({ path: `capturas/larga-${ruta.replace(/[^a-z0-9]+/gi, "_").slice(0, 20)}.png`, fullPage: true });
      await p.close();
    }
    await c.close();
  }
}

// 3. menú: recogido en angosto, lateral en ancho
for (const ancho of [360, 768, 1280]) {
  const { c } = await contexto("docente", ancho);
  const p = await c.newPage();
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  const boton = p.getByRole("button", { name: "Menú" });
  const botonVisible = await boton.isVisible();
  const enlacesAntes = await p.locator("nav a:visible").count();
  if (botonVisible) await boton.click();
  const enlacesDespues = await p.locator("nav a:visible").count();
  console.log(`3. menú · ${ancho}px → botón Menú ${botonVisible ? "visible" : "oculto"} · enlaces visibles antes ${enlacesAntes}, tras pulsar ${enlacesDespues}`);
  await c.close();
}
await b.close();
