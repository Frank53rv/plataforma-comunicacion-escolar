# RF-12 Gestión de cursos · CU-03, CU-04, CU-05 · RN-13, RN-15
# Prueba: CP-RF-12
#
# La nómina de cada curso: sus docentes, y sus alumnos con sus tutores, sobre vinculaciones
# vigentes. La Tabla 18 no tiene ninguna operación que lea personas y administrar docentes,
# alumnos y tutores exige conocer su identificador: la nómina viaja en GET /cursos, cuyos roles
# —directivo y docente— son los que administran personas. Sólo identificación, nombre, correo
# y estado. Una persona dada de baja sigue figurando, marcada, mientras su vinculación esté
# vigente (RN-11: la baja es lógica). Se resuelve por lotes: cuatro consultas, sea cual sea la
# cantidad de cursos, alumnos y tutores.
class NominaDeCursos
  def self.para(cursos)
    new(cursos).por_curso
  end

  def initialize(cursos)
    @curso_ids = cursos.map(&:id)
  end

  def por_curso
    docentes = docentes_por_curso
    alumnos = alumnos_por_curso
    @curso_ids.index_with do |id|
      { "docentes" => docentes.fetch(id, []), "alumnos" => alumnos.fetch(id, []) }
    end
  end

  private

  def persona(usuario)
    usuario.slice(:id, :nombre, :apellido, :correo, :estado)
  end

  # El titular primero, y luego por apellido.
  def docentes_por_curso
    DocenteCurso.vigentes.where(curso_id: @curso_ids).includes(:docente)
                .sort_by { |v| [ v.es_titular ? 0 : 1, v.docente.apellido, v.docente.nombre ] }
                .group_by(&:curso_id)
                .transform_values { |vinculos| vinculos.map { |v| persona(v.docente).merge("es_titular" => v.es_titular) } }
  end

  def alumnos_por_curso
    vinculos = AlumnoCurso.vigentes.where(curso_id: @curso_ids).includes(:alumno).to_a
    tutores = TutorAlumno.vigentes.where(alumno_id: vinculos.map(&:usuario_id)).includes(:tutor)
                         .group_by(&:alumno_id)

    vinculos.sort_by { |v| [ v.alumno.apellido, v.alumno.nombre ] }.group_by(&:curso_id).transform_values do |lista|
      lista.map do |v|
        propios = tutores.fetch(v.usuario_id, []).sort_by { |t| [ t.tutor.apellido, t.tutor.nombre ] }
        persona(v.alumno).merge("tutores" => propios.map { |t| persona(t.tutor) })
      end
    end
  end
end
