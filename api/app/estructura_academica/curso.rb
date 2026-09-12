# RF-15 Vinculación de docentes a cursos · CU-04 · RN-02
# Prueba: CP-RF-15
#
# Tabla 21 · «Unidad académica dentro de un año lectivo.» Nombre único dentro del año.
# Tabla 38 · nombre de tabla en singular conforme a D-01. turno como texto acotado
# conforme a D-07.
class Curso < ApplicationRecord
  self.table_name = "curso"

  enum :estado, { vigente: "vigente", archivado: "archivado" }, prefix: :estado, validate: true

  belongs_to :anio_lectivo, class_name: "AnioLectivo", inverse_of: :cursos
  has_many :vinculaciones_docentes, class_name: "DocenteCurso", foreign_key: :curso_id,
                                    inverse_of: :curso

  # Tabla 38 · nombre varchar(60) · turno varchar(20) (D-07)
  validates :nombre, :turno, presence: true
  validates :nombre, length: { maximum: 60 }
  validates :turno, length: { maximum: 20 }
end
