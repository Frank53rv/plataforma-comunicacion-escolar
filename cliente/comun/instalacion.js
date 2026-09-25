// RF-31 Notificación de anuncios · CU-06, CU-14 · RN-18
// Prueba: CP-RF-31
//
// Tabla 34 · el service worker y el manifiesto son propios y «hacen instalable el cliente,
// condición de la recepción en iOS según el riesgo R-03»: ese navegador sólo entrega el
// aviso push cuando la aplicación está añadida a la pantalla de inicio. Acá se reconoce si
// ya lo está y por qué vía puede instalarse, sin decidir nada: el navegador ofrece la
// instalación con `beforeinstallprompt`, y Safari no la ofrece, de modo que allí la única
// vía es el menú de compartir y lo que corresponde es indicarla.
export function estaInstalada(ventana = globalThis) {
  if (ventana.navigator?.standalone) return true;
  return ventana.matchMedia?.("(display-mode: standalone)").matches === true;
}

export function esIOS(agente = globalThis.navigator?.userAgent ?? "") {
  return /iPad|iPhone|iPod/.test(agente);
}

// El navegador emite `beforeinstallprompt` una sola vez y antes de que monte el componente,
// así que se retiene el suceso para poder invocarlo cuando la persona lo pida. Devuelve la
// baja de ambas escuchas, que React ejecuta al desmontar.
export function escucharInstalacion(
  { alOfrecer, alInstalar },
  ventana = globalThis,
) {
  const oferta = (suceso) => {
    suceso.preventDefault();
    alOfrecer(suceso);
  };
  ventana.addEventListener("beforeinstallprompt", oferta);
  ventana.addEventListener("appinstalled", alInstalar);
  return () => {
    ventana.removeEventListener("beforeinstallprompt", oferta);
    ventana.removeEventListener("appinstalled", alInstalar);
  };
}
