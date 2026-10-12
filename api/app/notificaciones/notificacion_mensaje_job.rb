# RF-28 Persistencia e historial de mensajes · RF-32 Notificación de mensajes · CU-12,
# CU-14 · RN-24
# Prueba: CP-RF-28 · CP-RF-32
#
# RF-32 (Tabla 10) · «El sistema debe emitir notificación por mensaje de conversación
# aplicando el rol del destinatario, su horario de disponibilidad y sus preferencias.»
# Figura 8 · «evento de mensaje» → el motor evalúa «rol, horario de disponibilidad y
# preferencias de cada participante no conectado». Tabla 4 · el mensaje en el canal grupal
# del curso notifica al docente vinculado y al tutor que participa del canal; nunca al
# directivo, y al alumno sólo en el canal grupal de alumnos (RF-24, Should have).
# No se notifica al autor ni a quien ya está conectado a la conversación. Cada destinatario
# tiene su propio envío, encolado ahora o al comienzo de su próxima franja de
# disponibilidad (RN-24: se difiere, no se descarta ni se agrupa).
class NotificacionMensajeJob < ApplicationJob
  queue_as :default

  def perform(mensaje_id, conectados_ids = [])
    mensaje = Mensaje.find_by(id: mensaje_id)
    return if mensaje.nil?

    destinatarios = mensaje.conversacion.integrantes_ids - [ mensaje.autor_id ] - Array(conectados_ids)
    ahora = Time.current
    Usuario.where(id: destinatarios, rol: %w[docente tutor]).find_each do |usuario|
      instante = Preferencia.de(usuario).instante_de_envio(ahora)
      next if instante.nil?

      EnvioDeMensajeJob.set(wait_until: instante).perform_later(mensaje.id, usuario.id)
    end
  end
end
