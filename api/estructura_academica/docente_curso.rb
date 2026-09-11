# RF-15 Vinculación de docentes a cursos · CU-04 · RN-02, RN-13
# Prueba: CP-RF-15
#
# Tabla 21 · «Vinculación entre un docente y un curso.» Un único titular vigente por
# curso. Par usuario-curso único entre los vigentes. Ambas restricciones las garantiza
# el motor con los índices parciales de la Tabla 38; acá se verifican antes, para
# rechazar con el estado del catálogo en lugar de con la violación del índice.
class DocenteCurso < ApplicationRecord
  self.table_name = "docente_curso"

  belongs_to :docente, class_name: "Usuario", foreign_key: :usuario_id
  belongs_to :curso, class_name: "Curso", inverse_of: :vinculaciones_docentes

  scope :vigentes, -> { where(vigente_hasta: nil) }
  scope :titulares, -> { where(es_titular: true) }

  def recurso
    slice(:id, :usuario_id, :curso_id, :es_titular, :vigente_desde, :vigente_hasta)
  end
end
