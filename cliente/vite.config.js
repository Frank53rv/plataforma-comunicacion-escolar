// Tabla 23 · React 19 construido con Vite 8. Produce archivos estáticos y elimina el
// proceso de servidor de renderizado, innecesario para paneles autenticados.
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Tabla 30 · valores de construcción del cliente. Son públicos por diseño y llegan por el
// entorno de la construcción (compose.yaml); el cliente estático no lee el entorno después.
const VALORES_DE_CONSTRUCCION = [
  "VITE_FCM_API_KEY",
  "VITE_FCM_PROJECT_ID",
  "VITE_FCM_SENDER_ID",
  "VITE_FCM_APP_ID",
  "VITE_VAPID_PUBLIC_KEY",
];

export default defineConfig(({ mode }) => {
  const entorno = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [react(), tailwindcss()],
    define: Object.fromEntries(
      VALORES_DE_CONSTRUCCION.map((clave) => [
        `process.env.${clave}`,
        JSON.stringify(entorno[clave] ?? ""),
      ]),
    ),
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
  };
});
