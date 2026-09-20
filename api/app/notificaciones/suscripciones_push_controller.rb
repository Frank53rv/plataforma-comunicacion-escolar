# RF-37 Degradación ante fallo de entrega · CU-14 · RNF-11
# Prueba: CP-RF-37
#
# Tabla 18 · POST /api/v1/suscripciones-push · directivo, docente, tutor, alumno ·
# «Registrar el identificador de destino del navegador». DELETE
# /api/v1/suscripciones-push/{id} · «Invalidar un identificador de destino».
# Tabla 29 · POST: token, navegador → recurso suscripcion_push. DELETE: sin cuerpo →
# recurso suscripcion_push con estado inválida.
class SuscripcionesPushController < ApplicationController
  autoriza :crear, roles: %w[directivo docente tutor alumno]
  autoriza :destruir, roles: %w[directivo docente tutor alumno]

  def crear
    p = params.permit(:token, :navegador)
    faltantes = %i[token navegador].select { |campo| p[campo].blank? }
    if faltantes.any?
      raise ErrorDeDominio::DatosInaceptables.new(
        detalle: "Faltan campos obligatorios: #{faltantes.join(', ')}."
      )
    end

    suscripcion = SuscripcionPush.registrar!(usuario: usuario_actual, token: p[:token], navegador: p[:navegador])

    render json: suscripcion.recurso, status: :created
  end

  # Una suscripción ajena se trata como inexistente (RN-15).
  def destruir
    suscripcion = SuscripcionPush.find_by(id: params[:id], usuario_id: usuario_actual.id)
    raise ErrorDeDominio::NoEncontrado.new if suscripcion.nil?

    render json: suscripcion.invalidar!.recurso, status: :ok
  end
end
