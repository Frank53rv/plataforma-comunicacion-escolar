# RF-09 Baja lógica de alumnos y tutores · CU-05 flujo B · RN-10, RN-11, RN-14
# Prueba: CP-RF-09
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

    persona.update!(estado: "dado_de_baja") unless persona.estado_dado_de_baja?
    persona
  end
end
