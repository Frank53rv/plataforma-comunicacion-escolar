# RF-17 Publicación de anuncios · CU-06 · RN-16, RN-17
# Prueba: CP-RF-17
#
# Tabla 14 · «Contenido de un anuncio en un momento dado.» El versionado por edición es
# RF-19 (Should have): esta entrega sólo produce la versión 1, la que CU-06 crea al
# publicar.
class AnuncioVersion < ApplicationRecord
  self.table_name = "anuncio_version"

  belongs_to :anuncio, inverse_of: :versiones
  has_many :entregas, class_name: "EntregaAnuncio", foreign_key: :anuncio_version_id,
                      inverse_of: :anuncio_version

  validates :titulo, presence: true, length: { maximum: 160 }
  validates :cuerpo, presence: true
end
