# RF-17 Publicación de anuncios · CU-06 · RN-16
# Prueba: CP-RF-17
#
# Tabla 14 · «Curso al que se dirige un anuncio.»
class AnuncioCurso < ApplicationRecord
  self.table_name = "anuncio_curso"

  belongs_to :anuncio, inverse_of: :vinculaciones_curso
  belongs_to :curso
end
