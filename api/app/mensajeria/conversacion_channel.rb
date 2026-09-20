# RF-25 Canal grupal del curso · RF-28 Persistencia e historial de mensajes · RF-29
# Restricción de participación · CU-12 · RN-23
# Prueba: CP-RF-25 · CP-RF-28 · CP-RF-29
#
# Tabla 29 · WSS /cable · «canal y conversacion_id en la suscripción» → confirmación de
# suscripción y, en adelante, mensajes difundidos. Figura 8 · pasos «validar token y
# vinculación con el curso» → «suscripción autorizada» → «canal establecido».
class ConversacionChannel < ApplicationCable::Channel
  # RF-29 (Tabla 10) · se impide la participación de un usuario en una conversación de un curso al que no está vinculado.
  def subscribed
    conversacion = Conversacion.find_by(id: params[:conversacion_id])
    return reject unless conversacion&.participa?(usuario_actual)

    conversacion.sincronizar_participantes!
    @conversacion = conversacion
    stream_for conversacion
  end

  # Figura 8 · «emitir mensaje» por el canal. Un cuerpo vacío no se persiste.
  def emitir(datos)
    return if datos["cuerpo"].blank?

    EmisionDeMensaje.emitir(conversacion: @conversacion, autor: usuario_actual, cuerpo: datos["cuerpo"])
  end
end
