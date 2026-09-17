# RF-28 Persistencia e historial de mensajes · CU-12 paso 6 · RN-24
# Prueba: CP-RF-28
#
# CU-12 paso 6 · «la interfaz evalúa, para cada participante no conectado, el rol, la
# franja horaria y las preferencias, y encola la notificación o la difiere.» El módulo D
# entrega el evento de mensaje (Figura 8, Figura 14); la evaluación es RF-32
# (Notificación de mensajes), del módulo E, que completa `perform`.
class NotificacionMensajeJob < ApplicationJob
  queue_as :default

  def perform(mensaje_id)
    # RF-32 · pendiente de construcción.
  end
end
