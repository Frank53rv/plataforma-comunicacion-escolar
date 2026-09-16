# RF-17 Publicación de anuncios · CU-06 · RN-16
# Prueba: CP-RF-17
#
# Tabla 21 · «Fila de entrega de una versión de anuncio a un destinatario.»
# specs/25-semantica-temporal.md · «Resolución del canal de entrega»: la fila nace con el
# canal establecido en la aplicación y sin causa registrada; el aviso se entrega allí
# conforme a RNF-11. Las marcas entregada_en, vista_en y leida_en pertenecen a RF-34,
# RF-35, RF-36 y RF-37, todavía sin construir: esta entrega sólo puebla enviada_en.
class EntregaAnuncio < ApplicationRecord
  self.table_name = "entrega_anuncio"

  enum :canal, { push: "push", aplicacion: "aplicacion" }, prefix: :canal, validate: true
  # Nulo mientras no haya fallo (specs/25-semantica-temporal.md, «Resolución del canal
  # de entrega»): la validación admite ese nulo y no lo trata como valor inadmisible.
  enum :causa_fallo, {
    indisponibilidad_del_servicio_push: "indisponibilidad_del_servicio_push",
    ausencia_de_acuse_del_cliente: "ausencia_de_acuse_del_cliente",
    falta_de_soporte_del_navegador: "falta_de_soporte_del_navegador",
    credencial_invalida: "credencial_invalida"
  }, prefix: :causa, validate: { allow_nil: true }

  belongs_to :anuncio_version, inverse_of: :entregas
  belongs_to :destinatario, class_name: "Usuario", foreign_key: :destinatario_id
end
