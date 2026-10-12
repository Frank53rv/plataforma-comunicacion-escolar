// RF-37 Degradación ante fallo de entrega · RF-31 · RF-32 · CU-14 · RNF-11
// Prueba: CP-RF-37
//
// Figura 18 · comun/ lleva el service worker. Presenta el aviso push cuando la aplicación
// está cerrada o en segundo plano, y avisa a las ventanas abiertas para que la bandeja se
// ponga al día en el momento (RF-37). FCM entrega en `event.data` el mensaje que la interfaz
// de programación envió: título y cuerpo dentro de `notification`. No decide nada: el aviso
// que llega es el que el servidor resolvió enviar (RNF-21).
self.addEventListener("push", (evento) => {
  let carga = {};
  try {
    carga = evento.data ? evento.data.json() : {};
  } catch {
    carga = {};
  }
  const aviso = carga.notification || {};
  evento.waitUntil(
    Promise.all([
      self.registration.showNotification(
        aviso.title || "Plataforma de comunicación escolar",
        {
          body: aviso.body || "",
          icon: "/icono.svg",
        },
      ),
      avisarALasVentanas(),
    ]),
  );
});

async function avisarALasVentanas() {
  if (!self.clients.matchAll) return;
  const ventanas = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  ventanas.forEach((ventana) => ventana.postMessage({ tipo: "aviso" }));
}

// Al tocar el aviso se abre la aplicación, cuya vista de entrada es la bandeja (RF-39).
self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  evento.waitUntil(self.clients.openWindow("/"));
});
