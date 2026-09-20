# RF-17 Publicación de anuncios · RF-34 Registro de estados de notificación · CU-06, CU-10,
# CU-14 · RN-16, RN-32
# Prueba: CP-RF-17 · CP-RF-34
#
# Tabla 14 · «Fila de entrega de una versión de anuncio a un destinatario.»
# Figura 9 · cuatro estados —enviada, entregada, vista y leída—; el fallo de envío no es
# un quinto estado: se registra en `causa_fallo`. Las transiciones son monótonas e
# idempotentes (RN-32): el estado actual no degrada aunque los eventos lleguen
# desordenados.
class EntregaAnuncio < ApplicationRecord
  self.table_name = "entrega_anuncio"

  # RF-34 · los cuatro estados, en el orden en que se alcanzan, y la marca de cada uno.
  ESTADOS = %w[enviada entregada vista leida].freeze
  MARCAS = {
    "enviada" => :enviada_en, "entregada" => :entregada_en,
    "vista" => :vista_en, "leida" => :leida_en
  }.freeze

  enum :canal, { push: "push", aplicacion: "aplicacion" }, prefix: :canal, validate: true
  # Nulo mientras no haya fallo: la validación admite ese nulo y no lo trata como valor
  # inadmisible.
  enum :causa_fallo, {
    indisponibilidad_del_servicio_push: "indisponibilidad_del_servicio_push",
    ausencia_de_acuse_del_cliente: "ausencia_de_acuse_del_cliente",
    falta_de_soporte_del_navegador: "falta_de_soporte_del_navegador",
    credencial_invalida: "credencial_invalida"
  }, prefix: :causa, validate: { allow_nil: true }

  belongs_to :anuncio_version, inverse_of: :entregas
  belongs_to :destinatario, class_name: "Usuario", foreign_key: :destinatario_id

  # Figura 12 · estadoActual() : EstadoEntrega. El más avanzado de los registrados.
  def estado_actual
    ESTADOS.reverse.find { |estado| self[MARCAS.fetch(estado)].present? }
  end

  # Figura 12 · registrarEstado(e). RN-32 · los estados no retroceden y la reemisión de
  # un evento ya registrado no altera su marca original: registrar un estado completa,
  # con la misma marca, los anteriores que falten, y no toca ninguna que ya exista.
  # Ninguna marca es anterior al envío (Tabla 27, CHECK de monotonía): la del evento
  # nunca precede a `enviada_en`, aunque el reloj de quien la emite vaya atrasado.
  # Devuelve :registrada, o :omitida si el evento no aportó nada nuevo.
  def registrar_estado(estado, momento: Time.current)
    posicion = ESTADOS.index(estado.to_s) or raise ArgumentError, "estado desconocido: #{estado}"

    with_lock do
      next :omitida if self[MARCAS.fetch(ESTADOS[posicion])].present?

      marca = [ momento, enviada_en ].max
      ESTADOS[1..posicion].each { |anterior| self[MARCAS.fetch(anterior)] ||= marca }
      save!
      :registrada
    end
  end

  # openapi/openapi.yaml · esquema EntregaAnuncio.
  def recurso
    slice(:id, :anuncio_version_id, :destinatario_id, :canal, :enviada_en, :entregada_en,
          :vista_en, :leida_en, :causa_fallo)
  end
end
