# RF-17 Publicación de anuncios · RF-31 Notificación de anuncios · CU-06, CU-14 · RN-16,
# RN-17, RN-18
# Prueba: CP-RF-17 · CP-RF-31
#
# RF-31 (Tabla 10) · «El sistema debe emitir una notificación push a cada destinatario al
# publicarse un anuncio, con independencia de su horario de disponibilidad. Los anuncios
# institucionales no son configurables por el destinatario.»
# RN-18 · el anuncio ignora el horario de disponibilidad y las preferencias: este trabajo
# no consulta Preferencia. Figura 7 · «encolar notificaciones» → «solicitud de envío»
# al servicio push. El envío, sus reintentos y la degradación son los de EnvioDeAvisoJob.
class NotificacionAnuncioJob < EnvioDeAvisoJob
  MAXIMO_DEL_CUERPO = 200

  private

  def contenido(entrega)
    version = entrega.anuncio_version
    [ version.titulo, version.cuerpo.truncate(MAXIMO_DEL_CUERPO) ]
  end
end
