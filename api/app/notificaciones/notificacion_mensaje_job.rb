# RF-28 Persistencia e historial de mensajes · CU-12 · RN-24
# Prueba: CP-RF-28
#
# RF-28 · el módulo D entrega el evento de mensaje (Figura 8, Figura 14); la evaluación
# de rol, franja horaria y preferencias de cada participante no conectado es RF-32
# (Notificación de mensajes), del módulo E, que completa `perform`.
class NotificacionMensajeJob < ApplicationJob
  queue_as :default

  def perform(mensaje_id)
    # RF-32 · pendiente de construcción.
  end
end
