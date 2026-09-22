# RF-12 Administración de cursos · RF-15 Vinculación de docentes a cursos · RF-25 Canal
# grupal del curso · CU-03, CU-04, CU-12 · RN-02, RN-23, RN-26
# Prueba: CP-RF-12 · CP-RF-15 · CP-RF-25
#
# Tabla 14 · «Unidad académica dentro de un año lectivo.» Nombre único dentro del año.
# Tabla 27 · nombre de tabla en singular. turno varchar(20). UNIQUE (anio_lectivo_id,
# nombre) atribuido a RN-26.
class Curso < ApplicationRecord
  self.table_name = "curso"

  enum :estado, { vigente: "vigente", archivado: "archivado" }, prefix: :estado, validate: true

  belongs_to :anio_lectivo, class_name: "AnioLectivo", inverse_of: :cursos
  has_many :vinculaciones_docentes, class_name: "DocenteCurso", foreign_key: :curso_id,
                                    inverse_of: :curso
  has_many :alumnos_vinculados_curso, class_name: "AlumnoCurso", foreign_key: :curso_id,
                                      inverse_of: :curso
  has_many :conversaciones, class_name: "Conversacion", inverse_of: :curso

  # RF-25 · «un canal grupal … existente desde la creación del curso». Se abre en la misma
  # transacción del alta, cualquiera sea la vía por la que el curso se crea.
  after_create :abrir_canal_grupal

  # Tabla 27 · nombre varchar(60) · turno varchar(20)
  validates :nombre, :turno, presence: true
  validates :nombre, length: { maximum: 60 }
  validates :turno, length: { maximum: 20 }

  # CU-03 E2 (Tabla 24, fila 409): se rechaza el nombre de curso repetido dentro del
  # mismo año lectivo. Tabla 27 atribuye el índice único (anio_lectivo_id, nombre) a
  # RN-26: se verifica acá para rechazar con 409 y la regla consignada, antes de la
  # violación del índice.
  def self.verificar_nombre_disponible!(anio_lectivo_id:, nombre:, excepto_id: nil)
    en_conflicto = where(anio_lectivo_id: anio_lectivo_id, nombre: nombre)
    en_conflicto = en_conflicto.where.not(id: excepto_id) if excepto_id
    return unless en_conflicto.exists?

    raise ErrorDeDominio::ConflictoDeRegla.new(
      regla: "RN-26",
      detalle: "Ya existe un curso con ese nombre en el mismo año lectivo."
    )
  end

  # Tabla 40 · «colección de curso con la cantidad de alumnos vinculados» (GET /cursos).
  def recurso
    slice(:id, :anio_lectivo_id, :nombre, :turno, :estado)
      .merge("alumnos_vinculados" => alumnos_vinculados_curso.vigentes.count)
  end

  private

  def abrir_canal_grupal
    conversaciones.create!(tipo: "grupal_de_tutores", estado: "activa")
  end
end
