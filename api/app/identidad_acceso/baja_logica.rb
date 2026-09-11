# RF-09 Baja lógica de alumnos y tutores · RF-10 Restricción de baja de tutor vinculado ·
# CU-05 flujo B y E3 · RN-10, RN-11, RN-12, RN-14
# Prueba: CP-RF-09 · CP-RF-10
#
# RN-11 · «Toda baja es lógica: revoca el acceso y conserva la totalidad del historial
# asociado.» Cambia únicamente el estado de la cuenta. Las vinculaciones, los códigos y
# —cuando existan— los anuncios y mensajes permanecen con su autoría (RN-14).
# El acceso queda revocado en el acto: la autenticación verifica el estado en cada
# petición, de modo que aun un token vigente deja de servir (CU-01 E2).
class BajaLogica
  def self.ejecutar(persona:, por:)
    unless PotestadDeBaja.permite?(quien: por, persona: persona)
      raise ErrorDeDominio::NoHabilitado.new(
        codigo: "sin_potestad_de_baja",
        detalle: "Sólo el directivo o el docente titular del curso pueden dar de baja."
      )
    end

    verificar_tutor_sin_alumnos_activos!(persona) if persona.tutor?

    persona.update!(estado: "dado_de_baja") unless persona.estado_dado_de_baja?
    persona
  end

  # RN-12 · «No se puede dar de baja a un tutor que mantenga al menos un alumno activo
  # en cualquier curso.» CU-05 E3 · 409 con la regla consignada.
  #
  # «Alumno activo en un curso» se lee como el alumno no dado de baja que conserva una
  # vinculación vigente con un curso, con independencia de que ya haya activado su
  # cuenta: el alumno pendiente de activación también es un alumno del curso. Es la
  # lectura que más protege lo que la regla resguarda.
  def self.verificar_tutor_sin_alumnos_activos!(tutor)
    alumnos = TutorAlumno.vigentes.where(tutor_id: tutor.id).select(:alumno_id)
    activos = Usuario.where(id: alumnos).where.not(estado: "dado_de_baja")
                     .where(id: AlumnoCurso.vigentes.select(:usuario_id))
    return unless activos.exists?

    raise ErrorDeDominio::ConflictoDeRegla.new(
      regla: "RN-12", detalle: "El tutor mantiene al menos un alumno activo en un curso."
    )
  end
end
