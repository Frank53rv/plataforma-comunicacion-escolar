// Tabla 34 · React 19 construido con Vite 8. Produce archivos estáticos y elimina el
// proceso de servidor de renderizado, innecesario para paneles autenticados.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Figura 18 · comun/ lleva el manifiesto y el service worker: se publican en la raíz,
  // que es donde el navegador les da alcance sobre toda la aplicación.
  publicDir: "comun/publico",
  build: { outDir: "dist" },
  // En la composición es nginx quien reenvía a la interfaz; en desarrollo lo hace Vite,
  // de modo que el cliente habla siempre con el mismo origen y no hace falta CORS.
  server: {
    proxy: {
      "/api/v1": { target: "http://localhost:3000", changeOrigin: true },
      "/cable": { target: "ws://localhost:3000", ws: true },
    },
  },
});
