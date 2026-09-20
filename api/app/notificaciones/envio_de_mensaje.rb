# RF-32 Notificación de mensajes · RF-37 Degradación ante fallo de entrega · CU-12, CU-14 ·
# RN-24
# Prueba: CP-RF-32
#
# Envía por push el aviso de un mensaje de conversación a un participante. A diferencia
# del anuncio no hay fila de entrega (RF-34 registra estados de las publicaciones): el
# mensaje ya está en la conversación, de modo que degradar es no hacer nada más, y sólo
# los fallos del proveedor quedan en la bitácora técnica (RNF-07). Que el destinatario no
# tenga suscripción no es un fallo que registrar por cada mensaje.
class EnvioDeMensaje
  MAXIMO_DEL_CUERPO = 200

  def self.para_usuario(mensaje, usuario)
    suscripciones = SuscripcionPush.vigentes.where(usuario_id: usuario.id).to_a
    return if suscripciones.empty?

    resumen = EnvioDeAviso.enviar_a(suscripciones, titulo: titulo_de(mensaje), cuerpo: cuerpo_de(mensaje))
    return if resumen.aceptadas.positive? || resumen.transitorios.empty?

    raise EnvioDeAviso::ErrorTransitorio, resumen.transitorios.first
  end

  # Agotados los reintentos: el aviso por push no sale; el mensaje sigue en la conversación.
  def self.registrar_indisponibilidad(usuario_id, codigo)
    suscripcion = SuscripcionPush.vigentes.find_by(usuario_id: usuario_id)
    BitacoraEnvio.registrar!(causa: "indisponibilidad_del_servicio_push", codigo_proveedor: codigo,
                             suscripcion: suscripcion)
  end

  def self.titulo_de(mensaje)
    mensaje.conversacion.curso.nombre
  end

  def self.cuerpo_de(mensaje)
    autor = mensaje.autor
    "#{autor.nombre} #{autor.apellido}: #{mensaje.cuerpo}".truncate(MAXIMO_DEL_CUERPO)
  end
  private_class_method :titulo_de, :cuerpo_de
end
