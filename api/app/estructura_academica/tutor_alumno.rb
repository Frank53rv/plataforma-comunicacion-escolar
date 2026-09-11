# RF-04 Alta de alumnos y tutores · RF-07 Regeneración · CU-05 · RN-03, RN-07
# Prueba: CP-RF-04 · CP-RF-07
#
# Tabla 21 · «Vinculación entre un tutor y un alumno.» Hasta dos tutores vigentes por
# alumno (RN-29), verificado en la capa de negocio conforme a la nota de la Tabla 38.
# Tabla 38 · nombre de tabla en singular conforme a D-01.
class TutorAlumno < ApplicationRecord
  self.table_name = "tutor_alumno"

  belongs_to :tutor, class_name: "Usuario", foreign_key: :tutor_id
  belongs_to :alumno, class_name: "Usuario", foreign_key: :alumno_id

  scope :vigentes, -> { where(vigente_hasta: nil) }

  def recurso
    slice(:id, :tutor_id, :alumno_id, :vigente_desde, :vigente_hasta)
  end
end
