// Punto de entrada del cliente web. Fig. 13 · aplicación de página única: aquí se monta el
// enrutador del navegador, que Aplicacion espera recibir de quien la monta.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./estilos.css";
import Aplicacion from "./Aplicacion.jsx";
import { registrarServiceWorker } from "./registroServiceWorker.js";

createRoot(document.getElementById("raiz")).render(
  <StrictMode>
    <BrowserRouter>
      <Aplicacion />
    </BrowserRouter>
  </StrictMode>,
);

registrarServiceWorker();
