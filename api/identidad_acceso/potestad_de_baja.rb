# RF-09 Baja lógica de alumnos y tutores · CU-05 flujo B · RN-10
# Prueba: CP-RF-09
#
# RN-10 · «La baja de un alumno o un tutor la ejecuta el directivo o el docente titular
# del curso. Los demás docentes no tienen esa atribución.»
#
# El curso del alumno es aquel en que tiene su vinculación vigente. El del tutor, el de
# los alumnos a los que está vinculado: el tutor no pertenece a un curso sino a sus
# alumnos (Tabla 21, tutor_alumno).
class PotestadDeBaja
  class << self
    def permite?(quien:, persona:)
      return true if quien.directivo?
      return false unless quien.docente?

      DocenteCurso.vigentes.titulares.where(usuario_id: quien.id, curso_id: cursos_de(persona)).exists?
    end

    private

    def cursos_de(persona)
      alumnos = if persona.alumno?
        Usuario.where(id: persona.id).select(:id)
      else
        TutorAlumno.vigentes.where(tutor_id: persona.id).select(:alumno_id)
      end

      AlumnoCurso.vigentes.where(usuario_id: alumnos).select(:curso_id)
    end
  end
end
