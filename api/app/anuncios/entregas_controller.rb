# RF-34 Registro de estados de notificación · CU-14 · RN-32
# Prueba: CP-RF-34
#
# Tabla 18 · POST /api/v1/entregas/acuses · tutor, alumno · «Registrar el acuse de
# recepción emitido por el cliente».
# Tabla 29 · anuncio_version_ids como lista → cantidad registrada y omitida por
# idempotencia.
# openapi/openapi.yaml · esquema RegistroEnLote: `registrada` y `omitida_por_idempotencia`.
# Figura 9 · el disparador de la transición a entregada es el acuse emitido por el
# cliente del destinatario, y no la respuesta del servicio push.
class EntregasController < ApplicationController
  autoriza :acusar, roles: %w[tutor alumno]

  # CU-14 (Tabla 13) · la entrega queda registrada como entregada por acuse del cliente.
  def acusar
    render json: registrar_en_lote("entregada"), status: :ok
  end

  private

  # RN-32 · sólo cuenta como registrada la publicación que tiene una fila de entrega
  # propia y que todavía no alcanzó ese estado; el resto —incluida la que no le
  # corresponde a quien pide— se cuenta como omitida, sin revelar cuál fue el caso.
  def registrar_en_lote(estado)
    ids = ids_de_publicaciones
    propias = EntregaAnuncio.where(destinatario_id: usuario_actual.id, anuncio_version_id: ids).to_a

    registradas = propias.count { |entrega| entrega.registrar_estado(estado) == :registrada }

    { registrada: registradas, omitida_por_idempotencia: ids.size - registradas }
  end

  def ids_de_publicaciones
    ids = params.permit(anuncio_version_ids: [])[:anuncio_version_ids]
    if ids.nil?
      raise ErrorDeDominio::DatosInaceptables.new(
        detalle: "Falta el campo obligatorio: anuncio_version_ids."
      )
    end

    ids.uniq
  end
end
