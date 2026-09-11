# RF-04 Alta de alumnos y tutores · RF-07 Regeneración · CU-05 · RN-03, RN-07
# Prueba: CP-RF-04 · CP-RF-07
#
# Tabla 21 · «Vinculación entre un alumno y un curso.» Un alumno pertenece a un solo
# curso vigente por año lectivo (RN-30), verificado en la capa de negocio conforme a la
# nota de la Tabla 38.
# Tabla 38 · nombre de tabla en singular conforme a D-01.
class AlumnoCurso < ApplicationRecord
  self.table_name = "alumno_curso"

  belongs_to :alumno, class_name: "Usuario", foreign_key: :usuario_id
  belongs_to :curso, class_name: "Curso"

  scope :vigentes, -> { where(vigente_hasta: nil) }

  def recurso
    slice(:id, :usuario_id, :curso_id, :vigente_desde, :vigente_hasta)
  end
end
