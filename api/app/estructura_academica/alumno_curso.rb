# RF-04 Alta de alumnos y tutores · RF-07 Regeneración · RF-13 Vinculación de alumnos a
# cursos · CU-05 · RN-03, RN-07, RN-30
# Prueba: CP-RF-04 · CP-RF-07 · CP-RF-13
#
# Tabla 21 · «Vinculación entre un alumno y un curso.» Un alumno pertenece a un solo
# curso vigente por año lectivo (RN-30), verificado en la capa de negocio conforme a la
# nota de la Tabla 38.
# Tabla 27 · nombre de tabla en singular.
class AlumnoCurso < ApplicationRecord
  self.table_name = "alumno_curso"

  belongs_to :alumno, class_name: "Usuario", foreign_key: :usuario_id
  belongs_to :curso, class_name: "Curso"

  scope :vigentes, -> { where(vigente_hasta: nil) }

  # RN-30 · «Un alumno pertenece a un solo curso vigente dentro de un mismo año
  # lectivo.» La nota de la Tabla 38 la manda a la capa de negocio porque el año se
  # deriva por la vinculación y no admite un índice declarativo. CU-05 E2 · 409.
  def self.verificar_pertenencia_unica!(alumno_id:, curso:)
    en_el_mismo_anio = vigentes.joins(:curso)
                               .where(usuario_id: alumno_id)
                               .where(curso: { anio_lectivo_id: curso.anio_lectivo_id })
    return unless en_el_mismo_anio.exists?

    raise ErrorDeDominio::ConflictoDeRegla.new(
      regla: "RN-30",
      detalle: "El alumno ya pertenece a un curso vigente de este año lectivo."
    )
  end

  def recurso
    slice(:id, :usuario_id, :curso_id, :vigente_desde, :vigente_hasta)
  end
end
