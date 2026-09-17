# RF-28 Persistencia e historial de mensajes · RF-25 Canal grupal del curso · CU-12 ·
# RN-23, RN-27, RN-28
# Prueba: CP-RF-28 · CP-RF-25
#
# Tabla 18 · GET y POST /api/v1/conversaciones/{id}/mensajes · participantes de la
# conversación · «Consultar el historial paginado» y «Emitir un mensaje».
# Tabla 29 · GET: pagina, por_pagina, desde, hasta y remitente_id → colección de mensaje
# con autor y enviado_en. POST: cuerpo → recurso mensaje.
# openapi/openapi.yaml · esquema Mensaje. Tabla 28 · orden por fecha descendente por
# omisión, invertible con `orden=enviado_en:asc`.
# Los adjuntos son RF-30, Should have (Tabla 10): el cuerpo sólo admite `cuerpo`.
class MensajesController < ApplicationController
  # Tabla 18 · «Participantes de la conversación»: el rol es docente, tutor o alumno; la
  # participación se verifica en la acción, con CU-12 E1 y 403.
  autoriza :index, roles: %w[docente tutor alumno]
  autoriza :crear, roles: %w[docente tutor alumno]

  def index
    conversacion = conversacion_del_participante!

    pagina = [ params[:pagina].to_i, 1 ].max
    por_pagina = params[:por_pagina].to_i
    por_pagina = 25 if por_pagina <= 0
    por_pagina = [ por_pagina, 100 ].min
    sentido = params[:orden].to_s == "enviado_en:asc" ? :asc : :desc

    relacion = filtrar(conversacion.mensajes).includes(:autor).order(enviado_en: sentido, id: sentido)
    datos = relacion.offset((pagina - 1) * por_pagina).limit(por_pagina)

    render json: {
      datos: datos.map(&:recurso),
      total: relacion.count, pagina: pagina, por_pagina: por_pagina
    }, status: :ok
  end

  # CU-12 pasos (3) a (6).
  def crear
    conversacion = conversacion_del_participante!
    texto = params.permit(:cuerpo)[:cuerpo]
    if texto.blank?
      raise ErrorDeDominio::DatosInaceptables.new(detalle: "Falta el campo obligatorio: cuerpo.")
    end

    mensaje = EmisionDeMensaje.emitir(conversacion: conversacion, autor: usuario_actual, cuerpo: texto)

    render json: mensaje.recurso, status: :created
  end

  private

  # CU-12 E1 · «si el usuario no está vinculado al curso, la suscripción se rechaza».
  # Tabla 24 · 403, «participación en conversación ajena».
  def conversacion_del_participante!
    conversacion = Conversacion.find(params[:id])
    unless conversacion.participa?(usuario_actual)
      raise ErrorDeDominio::NoHabilitado.new(
        codigo: "no_participa_de_la_conversacion",
        detalle: "El usuario no participa de esta conversación."
      )
    end

    conversacion.sincronizar_participantes!
    conversacion
  end

  def filtrar(relacion)
    relacion = relacion.where(autor_id: params[:remitente_id]) if params[:remitente_id].present?
    relacion = relacion.where(enviado_en: params[:desde]..) if params[:desde].present?
    relacion = relacion.where(enviado_en: ..params[:hasta]) if params[:hasta].present?
    relacion
  end
end
