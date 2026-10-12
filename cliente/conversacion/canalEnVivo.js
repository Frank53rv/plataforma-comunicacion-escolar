// RF-25 Canal grupal del curso · CU-12 · RN-23
// Prueba: CP-RF-25
//
// Tabla 29 · WSS /cable · «token en el parámetro de conexión, canal y conversacion_id en la
// suscripción» → confirmación de suscripción y, en adelante, mensajes difundidos. Figura 8
// · el mensaje llega a los participantes conectados. La interfaz de programación valida el
// token y la vinculación con el curso (RF-29) y rechaza la suscripción si no corresponde.
import { createConsumer } from "@rails/actioncable";

export function conectarCanal({
  token,
  conversacionId,
  alRecibir,
  alConectar,
  alDesconectar,
  alRechazar,
}) {
  const consumidor = createConsumer(
    `/cable?token=${encodeURIComponent(token)}`,
  );
  const suscripcion = consumidor.subscriptions.create(
    { channel: "ConversacionChannel", conversacion_id: conversacionId },
    {
      received: alRecibir,
      connected: alConectar,
      disconnected: alDesconectar,
      rejected: alRechazar,
    },
  );
  return () => {
    suscripcion.unsubscribe();
    consumidor.disconnect();
  };
}
