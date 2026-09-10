// Tabla 34 · React 19 construido con Vite 8. Produce archivos estáticos y elimina el
// proceso de servidor de renderizado, innecesario para paneles autenticados.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { outDir: "dist" },
});
