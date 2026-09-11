# RF-04 Alta de alumnos y tutores · RF-07 Regeneración · RF-14 Vinculación de tutores
# a alumnos · CU-05 · RN-03, RN-07, RN-29
# Prueba: CP-RF-04 · CP-RF-07 · CP-RF-14
#
# Tabla 21 · «Vinculación entre un tutor y un alumno.» Hasta dos tutores vigentes por
# alumno (RN-29), verificado en la capa de negocio conforme a la nota de la Tabla 38.
# Tabla 38 · nombre de tabla en singular conforme a D-01.
class TutorAlumno < ApplicationRecord
  self.table_name = "tutor_alumno"

  belongs_to :tutor, class_name: "Usuario", foreign_key: :tutor_id
  belongs_to :alumno, class_name: "Usuario", foreign_key: :alumno_id

  scope :vigentes, -> { where(vigente_hasta: nil) }

  # RN-29 · «Un alumno admite hasta dos tutores vinculados de manera simultánea. La
  # vinculación de un tercero se rechaza mientras los dos anteriores permanezcan
  # vigentes.» La nota de la Tabla 38 la manda a la capa de negocio. CU-05 E1 · 409.
  MAXIMO_POR_ALUMNO = 2

  def self.verificar_limite!(alumno)
    return if vigentes.where(alumno_id: alumno.id).count < MAXIMO_POR_ALUMNO

    raise ErrorDeDominio::ConflictoDeRegla.new(
      regla: "RN-29", detalle: "El alumno ya tiene dos tutores vigentes."
    )
  end

  def recurso
    slice(:id, :tutor_id, :alumno_id, :vigente_desde, :vigente_hasta)
  end
end
