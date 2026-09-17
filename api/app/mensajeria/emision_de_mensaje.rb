# RF-28 Persistencia e historial de mensajes · RF-25 Canal grupal del curso · CU-12 ·
# RN-23, RN-28
# Prueba: CP-RF-28 · CP-RF-25
#
# Figura 8 · «persistir mensaje» → «mensaje persistido» → «difundir mensaje a los
# participantes conectados» → «evento de mensaje» al motor de notificaciones. La misma
# secuencia la recorren la operación HTTP y la emisión por el canal de tiempo real.
# CU-12 paso (6) · la evaluación de rol, franja y preferencias de cada participante no
# conectado es RF-32, del módulo E: acá sólo se entrega el evento.
class EmisionDeMensaje
  def self.emitir(conversacion:, autor:, cuerpo:)
    mensaje = conversacion.mensajes.create!(autor: autor, cuerpo: cuerpo, enviado_en: Time.current)

    ConversacionChannel.broadcast_to(conversacion, mensaje.recurso)
    NotificacionMensajeJob.perform_later(mensaje.id)

    mensaje
  end
end
