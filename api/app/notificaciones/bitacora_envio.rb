# RF-37 Degradación ante fallo de entrega · CU-14 · RNF-07, RN-27
# Prueba: CP-RF-37
#
# Tabla 14 · «Registro técnico de un fallo de envío.» Tabla 27 · índice sobre
# ocurrido_en, para la purga. RNF-07 · «La bitácora técnica de fallos de envío —causa,
# código de error del proveedor y token invalidado—, doce meses.»
class BitacoraEnvio < ApplicationRecord
  self.table_name = "bitacora_envio"

  enum :causa, {
    indisponibilidad_del_servicio_push: "indisponibilidad_del_servicio_push",
    ausencia_de_acuse_del_cliente: "ausencia_de_acuse_del_cliente",
    falta_de_soporte_del_navegador: "falta_de_soporte_del_navegador",
    credencial_invalida: "credencial_invalida"
  }, prefix: :causa, validate: true

  belongs_to :entrega_anuncio, optional: true
  belongs_to :suscripcion, class_name: "SuscripcionPush", optional: true

  validates :codigo_proveedor, presence: true, length: { maximum: 80 }

  # RNF-07 · doce meses desde cada registro, con independencia del año lectivo.
  def self.purgar(meses: Integer(ENV.fetch("RETENCION_BITACORA_MESES", 12)))
    where(ocurrido_en: ...meses.months.ago).delete_all
  end

  def self.registrar!(causa:, codigo_proveedor:, entrega: nil, suscripcion: nil)
    create!(causa: causa, codigo_proveedor: codigo_proveedor.to_s.first(80), entrega_anuncio: entrega,
            suscripcion: suscripcion, ocurrido_en: Time.current)
  end
end
