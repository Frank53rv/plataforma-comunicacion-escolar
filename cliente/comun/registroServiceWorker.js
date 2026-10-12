// RF-37 Degradación ante fallo de entrega · CU-14 · RNF-11
// Prueba: CP-RF-37
//
// Figura 18 · comun/ lleva el service worker. RNF-11: la falta de soporte del navegador no
// impide operar, de modo que el registro nunca lanza: informa la ausencia con null y el
// servidor, sin suscripción vigente, entrega el aviso dentro de la aplicación.
export async function registrarServiceWorker(navegador = globalThis.navigator) {
  if (!navegador || !("serviceWorker" in navegador)) return null;
  try {
    return await navegador.serviceWorker.register("/service-worker.js");
  } catch {
    return null;
  }
}
