// Punto de entrada del cliente web. Los paneles diferenciados por rol, la bandeja de
// anuncios, la conversación y las preferencias se construyen en el incremento 5
// (WP7, módulo F) conforme al plan de la Tabla 47.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./estilos.css";
import Aplicacion from "./Aplicacion.jsx";
import { registrarServiceWorker } from "./registroServiceWorker.js";

createRoot(document.getElementById("raiz")).render(
  <StrictMode>
    <Aplicacion />
  </StrictMode>,
);

registrarServiceWorker();
