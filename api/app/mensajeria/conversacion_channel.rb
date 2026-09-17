# RF-25 Canal grupal del curso · CU-12 · RN-23
# Prueba: CP-RF-25
#
# Tabla 29 · WSS /cable · «canal y conversacion_id en la suscripción» → confirmación de
# suscripción y, en adelante, mensajes difundidos. Figura 8 · pasos «validar token y
# vinculación con el curso» → «suscripción autorizada» → «canal establecido».
class ConversacionChannel < ApplicationCable::Channel
  def subscribed
    conversacion = Conversacion.find_by(id: params[:conversacion_id])
    return reject unless conversacion&.participa?(usuario_actual)

    conversacion.sincronizar_participantes!
    stream_for conversacion
  end
end
