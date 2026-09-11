# RF-07 Regeneración de código de activación · CU-04, CU-05 · RN-07, RN-08
# Prueba: CP-RF-07
#
# RN-07 · «El docente regenera los códigos de los alumnos y tutores de sus cursos; el
# directivo, los de los docentes.»
# RN-08 · la cuenta directiva no tiene instancia superior dentro del sistema: su código
# no lo regenera nadie, se repone por variable de entorno.
#
# La Tabla 27 declara los roles de la operación como «Directivo (docentes), docente
# (alumnos y tutores)». El rol habilita la operación; esta cadena decide sobre quién.
class CadenaDeRegeneracion
  class << self
    def permite?(quien:, para:)
      case quien.rol
      when "directivo" then para.rol == "docente"
      when "docente"   then %w[alumno tutor].include?(para.rol) && de_sus_cursos?(quien, para)
      else false
      end
    end

    private

    # «de sus cursos»: las vinculaciones vigentes del docente, del alumno y del tutor.
    def de_sus_cursos?(docente, persona)
      cursos = DocenteCurso.vigentes.where(usuario_id: docente.id).select(:curso_id)
      alumnos = AlumnoCurso.vigentes.where(curso_id: cursos).select(:usuario_id)

      case persona.rol
      when "alumno" then alumnos.where(usuario_id: persona.id).exists?
      when "tutor"  then TutorAlumno.vigentes.where(tutor_id: persona.id, alumno_id: alumnos).exists?
      end
    end
  end
end
