# RF-33 Configuración de preferencias · CU-13 · RN-18, RN-24
# Prueba: CP-RF-33
#
# Tabla 18 · GET y PUT /api/v1/usuarios/me/preferencias · directivo, docente, tutor,
# alumno · «Consultar» y «Configurar el horario de disponibilidad y las preferencias».
# Tabla 29 · GET: sin parámetros → hora_inicio, hora_fin, recibir_mensajes. PUT: los
# tres campos → recurso preferencia.
# openapi/openapi.yaml · esquema Preferencia: «los anuncios institucionales no están
# alcanzados por esta configuración» (RN-18); esta operación no los toca, sólo rige
# para los mensajes de conversación (RN-24).
class PreferenciasController < ApplicationController
  autoriza :mostrar, roles: %w[directivo docente tutor alumno]
  autoriza :actualizar, roles: %w[directivo docente tutor alumno]

  def mostrar
    render json: Preferencia.de(usuario_actual).recurso, status: :ok
  end

  def actualizar
    preferencia = Preferencia.de(usuario_actual)
    preferencia.assign_attributes(parametros)
    preferencia.save!

    render json: preferencia.recurso, status: :ok
  end

  private

  def parametros
    p = params.permit(:hora_inicio, :hora_fin, :recibir_mensajes)
    faltantes = %i[hora_inicio hora_fin recibir_mensajes].select { |campo| p[campo].nil? }
    if faltantes.any?
      raise ErrorDeDominio::DatosInaceptables.new(
        detalle: "Faltan campos obligatorios: #{faltantes.join(', ')}."
      )
    end

    { hora_inicio: hora_valida!(p[:hora_inicio]), hora_fin: hora_valida!(p[:hora_fin]),
      recibir_mensajes: ActiveModel::Type::Boolean.new.cast(p[:recibir_mensajes]) }
  end

  def hora_valida!(texto)
    Time.strptime(texto.to_s, "%H:%M")
  rescue ArgumentError
    raise ErrorDeDominio::DatosInaceptables.new(detalle: "La hora #{texto.inspect} no tiene el formato HH:MM.")
  end
end
