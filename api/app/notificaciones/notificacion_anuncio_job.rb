# RF-17 Publicación de anuncios · CU-06 · RN-16, RN-17
# Prueba: CP-RF-17
#
# RF-17 · encolar el envío push de cada notificación es lo que tiene comprometido; el
# cuerpo de la notificación —resolución del canal ya fijado por EntregaAnuncio, ignorar
# el horario de disponibilidad por RN-18, registrar la causa de fallo por RF-37— es
# RF-31 (Notificación de anuncios), todavía sin construir. Este job sólo deja encolada
# la fila de entrega; RF-31 completa `perform`.
class NotificacionAnuncioJob < ApplicationJob
  queue_as :default

  def perform(entrega_anuncio_id)
    # RF-31 · pendiente de construcción.
  end
end
