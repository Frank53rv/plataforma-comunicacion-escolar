# RF-28 Persistencia e historial de mensajes · RF-25 Canal grupal del curso · CU-12 ·
# RN-23, RN-28
# Prueba: CP-RF-28 · CP-RF-25
#
# Figura 8 · «persistir mensaje» → «mensaje persistido» → «difundir mensaje a los
# participantes conectados» → «evento de mensaje» al motor de notificaciones. La misma
# secuencia la recorren la operación HTTP y la emisión por el canal de tiempo real.
# RF-32 · la evaluación de rol, franja y preferencias de cada participante no
# conectado es del motor de notificaciones: acá se entrega el evento, con los usuarios
# que ya están conectados a la conversación.
class EmisionDeMensaje
  def self.emitir(conversacion:, autor:, cuerpo:)
    mensaje = conversacion.mensajes.create!(autor: autor, cuerpo: cuerpo, enviado_en: Time.current)

    ConversacionChannel.broadcast_to(conversacion, mensaje.recurso)
    NotificacionMensajeJob.perform_later(mensaje.id, conectados(conversacion))

    mensaje
  end

  # Figura 8 · «participante conectado»: quien tiene abierta una suscripción a esta
  # conversación. Sólo el proceso web ve las conexiones del canal —la cola corre en otro
  # proceso—, así que se calcula acá, al emitir, y se le pasa al trabajo.
  def self.conectados(conversacion)
    ActionCable.server.connections.filter_map do |conexion|
      suscrito = conexion.subscriptions.identifiers.any? do |identificador|
        JSON.parse(identificador)["conversacion_id"] == conversacion.id
      end
      conexion.usuario_actual.id if suscrito
    end
  end
end
