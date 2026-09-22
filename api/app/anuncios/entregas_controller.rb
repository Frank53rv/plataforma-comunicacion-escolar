# RF-34 Registro de estados de notificación · RF-35 Emisión de eventos de vista en lote ·
# RF-36 Idempotencia del registro de eventos · CU-10, CU-14 · RN-32
# Prueba: CP-RF-34 · CP-RF-35 · CP-RF-36
#
# Tabla 18 · POST /api/v1/entregas/acuses · tutor, alumno · «Registrar el acuse de
# recepción emitido por el cliente». POST /api/v1/entregas/vistas · tutor, alumno ·
# «Registrar en lote los eventos de vista». POST /api/v1/entregas/lecturas · tutor,
# alumno · «Registrar el evento de lectura».
# Tabla 29 · acuses y vistas: anuncio_version_ids como lista → cantidad registrada y
# omitida por idempotencia. lecturas: anuncio_version_id → entrega_anuncio con leida_en.
# openapi/openapi.yaml · esquemas RegistroEnLote y EntregaAnuncio.
# Figura 9 · el disparador de la transición a entregada es el acuse emitido por el
# cliente del destinatario, y no la respuesta del servicio push.
class EntregasController < ApplicationController
  autoriza :acusar, roles: %w[tutor alumno]
  autoriza :ver, roles: %w[tutor alumno]
  autoriza :leer, roles: %w[tutor alumno]

  # CU-14 (Tabla 13) · la entrega queda registrada como entregada por acuse del cliente.
  def acusar
    render json: registrar_en_lote("entregada"), status: :ok
  end

  # RF-35 · el cliente acumula los identificadores de los anuncios que ingresan al área
  # visible y los emite agrupados en una sola petición. CU-10 (Tabla 13) · el estado
  # vista queda registrado con marca de tiempo, de forma monótona e idempotente.
  def ver
    render json: registrar_en_lote("vista"), status: :ok
  end

  # RF-36 · la reemisión de la lectura no altera la marca original y responde igual que
  # la primera vez. CU-10 (Tabla 13) · el estado leída queda registrado con marca de
  # tiempo, de forma monótona e idempotente. Una publicación sin fila de entrega para
  # quien pide se trata como inexistente (404), para no revelar que existe (RN-15).
  def leer
    id = params.permit(:anuncio_version_id)[:anuncio_version_id]
    if id.blank?
      raise ErrorDeDominio::DatosInaceptables.new(detalle: "Falta el campo obligatorio: anuncio_version_id.")
    end

    entrega = EntregaAnuncio.find_by(destinatario_id: usuario_actual.id, anuncio_version_id: id)
    raise ErrorDeDominio::NoEncontrado.new if entrega.nil?

    entrega.registrar_estado("leida")
    render json: entrega.reload.recurso, status: :ok
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
