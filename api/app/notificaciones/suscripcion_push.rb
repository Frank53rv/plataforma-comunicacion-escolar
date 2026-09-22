# RF-37 Degradación ante fallo de entrega · CU-14 · RNF-11
# Prueba: CP-RF-37
#
# Tabla 14 · «Identificador de destino del navegador de un usuario para el servicio de
# notificaciones push.» Tabla 27 · UNIQUE (token); índice parcial sobre usuario_id donde
# el estado es vigente. Figura 11 · SuscripcionPush: estado, creadaEn, invalidadaEn,
# invalidar().
class SuscripcionPush < ApplicationRecord
  self.table_name = "suscripcion_push"

  enum :estado, { vigente: "vigente", invalida: "invalida" }, prefix: :estado, validate: true

  belongs_to :usuario

  validates :token, presence: true, length: { maximum: 255 }
  validates :navegador, presence: true, length: { maximum: 80 }

  scope :vigentes, -> { where(estado: "vigente") }

  # Un mismo navegador identifica a una sola suscripción (UNIQUE token). Si la presenta
  # otra persona, el dispositivo es de quien la presenta ahora; si estaba inválida, el
  # navegador vuelve a estar habilitado. Idempotente contra concurrencia.
  def self.registrar!(usuario:, token:, navegador:)
    creada_en = find_by(token: token)&.creada_en || Time.current
    upsert({
      token: token,
      usuario_id: usuario.id,
      navegador: navegador,
      estado: "vigente",
      invalidada_en: nil,
      creada_en: creada_en
    }, unique_by: :token, on_duplicate: :update)
    find_by!(token: token)
  end

  # Figura 11 · invalidar(). Idempotente: no altera la marca de una ya inválida.
  def invalidar!
    return self if estado_invalida?

    update!(estado: "invalida", invalidada_en: Time.current)
    self
  end

  # openapi/openapi.yaml · esquema SuscripcionPush. El identificador de destino no se
  # devuelve: es el dato que el navegador ya conoce y que no hace falta exponer.
  def recurso
    slice(:id, :usuario_id, :navegador, :estado, :creada_en, :invalidada_en)
  end
end
