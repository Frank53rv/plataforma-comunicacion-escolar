# RF-15 Vinculación de docentes a cursos · CU-04 · RN-02
# Prueba: CP-RF-15
#
# Tabla 21 · «Período académico que contiene los cursos y delimita el archivado.»
# Tabla 38 · nombre de tabla en singular conforme a D-01. Un solo año lectivo vigente,
# garantizado por el índice parcial de la Tabla 38 (RN-31).
class AnioLectivo < ApplicationRecord
  self.table_name = "anio_lectivo"

  enum :estado, { vigente: "vigente", cerrado: "cerrado" }, prefix: :estado, validate: true

  has_many :cursos, class_name: "Curso", foreign_key: :anio_lectivo_id, inverse_of: :anio_lectivo
end
