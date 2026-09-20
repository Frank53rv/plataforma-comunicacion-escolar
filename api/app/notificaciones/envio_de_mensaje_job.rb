# RF-32 Notificación de mensajes · RF-37 Degradación ante fallo de entrega · CU-12, CU-14 ·
# RN-24
# Prueba: CP-RF-32
#
# RN-24 · «Los mensajes de conversación respetan el horario de disponibilidad y las
# preferencias del destinatario; fuera de la franja se difieren, no se descartan. Nada se
# silencia.» Diferir consiste en volver a encolar el envío con un instante anterior al cual
# no se envía, igual al comienzo de la próxima franja del destinatario; no se agrupa con
# otros ni se sustituye. Al ejecutarse se evalúa de nuevo: las preferencias pueden haber
# cambiado. Los reintentos por causa transitoria son los de PoliticaDeEnvio (RNF-12).
class EnvioDeMensajeJob < ApplicationJob
  queue_as :default

  retry_on EnvioDeAviso::ErrorTransitorio,
           wait: ->(ejecuciones) { PoliticaDeEnvio::REINTENTOS.fetch(ejecuciones - 1) },
           attempts: PoliticaDeEnvio::REINTENTOS.size + 1 do |trabajo, error|
    EnvioDeMensaje.registrar_indisponibilidad(trabajo.arguments.second, error.codigo)
  end

  def perform(mensaje_id, usuario_id)
    mensaje = Mensaje.find_by(id: mensaje_id)
    usuario = Usuario.find_by(id: usuario_id)
    return if mensaje.nil? || usuario.nil? || !usuario.puede_autenticarse?
    return unless mensaje.conversacion.participa?(usuario)

    # Al ejecutarse se evalúa de nuevo: las preferencias pueden haber cambiado desde que
    # se encoló el envío.
    ahora = Time.current
    instante = Preferencia.de(usuario).instante_de_envio(ahora)
    return if instante.nil?

    if instante > ahora
      self.class.set(wait_until: instante).perform_later(mensaje_id, usuario_id)
    else
      EnvioDeMensaje.para_usuario(mensaje, usuario)
    end
  end
end
