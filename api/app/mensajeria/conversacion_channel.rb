# RF-25 Canal grupal del curso · RF-28 Persistencia e historial de mensajes · RF-29
# Restricción de participación · CU-12 · RN-23
# Prueba: CP-RF-25 · CP-RF-28 · CP-RF-29
#
# Tabla 31 · WSS /cable · «canal y conversacion_id en la suscripción» → confirmación de
# suscripción y, en adelante, mensajes difundidos. Figura 8 · pasos «validar token y
# vinculación con el curso» → «suscripción autorizada» → «canal establecido».
class ConversacionChannel < ApplicationCable::Channel
  # RF-29 (Tabla 10) · se impide la participación de un usuario en una conversación de un curso al que no está vinculado.
  def subscribed
    conversacion = Conversacion.find_by(id: params[:conversacion_id])
    return reject unless conversacion&.participa?(usuario_actual)

    conversacion.sincronizar_participantes!
    @conversacion = conversacion
    # Con un manejador propio, ActionCable no decodifica lo publicado: sin el coder, el cliente
    # recibiría el mensaje como texto y no como objeto.
    stream_for conversacion, coder: ActiveSupport::JSON, &method(:difundir)
  end

  # Figura 8 · «emitir mensaje» por el canal. Un cuerpo vacío no se persiste.
  def emitir(datos)
    return revocar unless autorizado?
    return if datos["cuerpo"].blank?

    EmisionDeMensaje.emitir(conversacion: @conversacion, autor: @usuario, cuerpo: datos["cuerpo"])
  end

  private

  def difundir(mensaje)
    autorizado? ? transmit(mensaje) : revocar
  end

  # RN-23 · RN-11 · la pertenencia se evalúa contra las vinculaciones vigentes y el estado de
  # la cuenta en cada mensaje, no sólo al suscribirse.
  def autorizado?
    @usuario = Usuario.find_by(id: usuario_actual.id)
    @usuario&.puede_autenticarse? && @conversacion.participa?(@usuario)
  end

  def revocar
    stop_all_streams
    connection.close(reason: "unauthorized", reconnect: false)
  end
end
