# RF-11 Creación del año lectivo · RF-15 Vinculación de docentes a cursos · CU-03, CU-04 ·
# RN-02, RN-31
# Prueba: CP-RF-11 · CP-RF-15
#
# Tabla 14 · «Período académico que contiene los cursos y delimita el archivado.»
# Tabla 27 · nombre de tabla en singular conforme a D-01. Un solo año lectivo vigente,
# garantizado por el índice parcial de la Tabla 27 (RN-31).
class AnioLectivo < ApplicationRecord
  self.table_name = "anio_lectivo"

  enum :estado, { vigente: "vigente", cerrado: "cerrado" }, prefix: :estado, validate: true

  has_many :cursos, class_name: "Curso", foreign_key: :anio_lectivo_id, inverse_of: :anio_lectivo

  validates :anio, presence: true

  def recurso
    slice(:id, :anio, :estado, :abierto_en, :cerrado_en)
  end
end
