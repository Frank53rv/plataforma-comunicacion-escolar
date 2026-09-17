# RF-25 Canal grupal del curso · RF-29 Restricción de participación · CU-12 · RN-23
# Prueba: CP-RF-25 · CP-RF-29
#
# Tabla 14 · «Canal de mensajería asociado a un curso.» Tabla 27 · tipo
# tipo_conversacion_enum y estado estado_conversacion_enum; UNIQUE parcial (curso_id,
# tipo) para los tipos grupales. Figura 12 · Conversacion 1 — 1..* Participante,
# 1 — 0..* Mensaje.
# RF-25 · el canal grupal del curso lo integran sus docentes y los tutores de sus
# alumnos. El canal de alumnos (RF-24) y las conversaciones privadas (RF-26, RF-27) son
# Should have (Tabla 10): los valores del enumerado existen, pero ninguna operación los
# produce.
class Conversacion < ApplicationRecord
  self.table_name = "conversacion"

  enum :tipo, {
    grupal_de_tutores: "grupal_de_tutores", grupal_de_alumnos: "grupal_de_alumnos",
    privada: "privada"
  }, prefix: :tipo, validate: true

  enum :estado, { activa: "activa", solo_lectura: "solo_lectura" }, prefix: :estado, validate: true

  belongs_to :curso, inverse_of: :conversaciones
  has_many :participantes, inverse_of: :conversacion
  has_many :mensajes, inverse_of: :conversacion

  # RN-23 · «Un usuario solo participa en conversaciones de cursos a los que está
  # vinculado.» La pertenencia se evalúa siempre contra las vinculaciones vigentes: el
  # docente, por su vinculación al curso; el tutor, por la de alguno de sus alumnos.
  def self.del_usuario(usuario)
    case usuario.rol
    when "docente" then tipo_grupal_de_tutores.where(curso_id: usuario.cursos_vigentes_como_docente)
    when "tutor" then tipo_grupal_de_tutores.where(curso_id: cursos_de_los_alumnos_de(usuario))
    else none
    end
  end

  # CU-12 precondición · «el usuario está vinculado al curso de la conversación».
  def self.vinculado_al_curso?(usuario, curso_id)
    case usuario.rol
    when "docente" then usuario.dicta_curso?(curso_id)
    when "tutor" then cursos_de_los_alumnos_de(usuario).exists?(curso_id: curso_id)
    when "alumno" then AlumnoCurso.vigentes.exists?(usuario_id: usuario.id, curso_id: curso_id)
    else false
    end
  end

  # CU-12 E1 · Tabla 24 · 403 a quien no está vinculado al curso.
  def self.verificar_vinculacion_al_curso!(usuario, curso_id)
    return if vinculado_al_curso?(usuario, curso_id)

    raise ErrorDeDominio::NoHabilitado.new(
      codigo: "no_vinculado_al_curso", detalle: "El usuario no está vinculado a este curso."
    )
  end

  # CU-12 E1 · Tabla 24 · 404 si la conversación no existe; 403, «participación en
  # conversación ajena», si existe y quien pide no la integra.
  def self.de_participante!(id, usuario)
    conversacion = find(id)
    return conversacion if conversacion.participa?(usuario)

    raise ErrorDeDominio::NoHabilitado.new(
      codigo: "no_participa_de_la_conversacion",
      detalle: "El usuario no participa de esta conversación."
    )
  end

  def self.cursos_de_los_alumnos_de(tutor)
    alumnos = TutorAlumno.vigentes.where(tutor_id: tutor.id).select(:alumno_id)
    AlumnoCurso.vigentes.where(usuario_id: alumnos).select(:curso_id)
  end

  def participa?(usuario)
    Conversacion.del_usuario(usuario).exists?(id: id)
  end

  # Registra como participantes a los integrantes vigentes que todavía no lo están. La
  # fecha de ingreso es el inicio del día de la vinculación que los incorpora, en la zona
  # del punto 4.2: la del docente al curso; para el tutor, la más tardía entre la suya con
  # el alumno y la del alumno con el curso.
  def sincronizar_participantes!
    filas = integrantes.map do |usuario_id, desde|
      { conversacion_id: id, usuario_id: usuario_id, incorporado_en: desde.in_time_zone }
    end
    Participante.insert_all(filas, unique_by: %i[conversacion_id usuario_id]) if filas.any?
  end

  def recurso
    slice(:id, :curso_id, :tipo, :estado)
  end

  # openapi/openapi.yaml · esquema ConversacionConNoLeidos, sin `no_leidos`.
  def recurso_con_ultimo_mensaje
    recurso.merge("ultimo_mensaje" => mensajes.order(enviado_en: :desc).first&.recurso)
  end

  private

  def integrantes
    docentes = DocenteCurso.vigentes.where(curso_id: curso_id).pluck(:usuario_id, :vigente_desde)
    alumnos = AlumnoCurso.vigentes.where(curso_id: curso_id).pluck(:usuario_id, :vigente_desde).to_h
    tutores = TutorAlumno.vigentes.where(alumno_id: alumnos.keys)
                         .pluck(:tutor_id, :alumno_id, :vigente_desde)
                         .map { |tutor_id, alumno_id, desde| [ tutor_id, [ desde, alumnos[alumno_id] ].max ] }

    (docentes + tutores).group_by(&:first).transform_values { |pares| pares.map(&:last).min }
  end
end
