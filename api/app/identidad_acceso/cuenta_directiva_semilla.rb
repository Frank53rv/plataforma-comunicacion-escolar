# RF-43 Cambio obligatorio de credencial provisional · CU-02 · RN-08, RN-09
# Prueba: CP-RF-43
#
# RN-08 · «El sistema no dispone de recuperación autónoma de la cuenta directiva. Se
# resuelve reponiendo la credencial provisional por variable de entorno.»
# Tabla 30 · DIRECTIVO_CORREO y DIRECTIVO_CREDENCIAL_PROVISIONAL.
# Tabla 35, paso 5 · la reposición es una tarea de mantenimiento, no una operación de
# la interfaz: crear una ruta para ella sería una ruta fuera de las 43 (Boundary 4).
class CuentaDirectivaSemilla
  def self.reponer
    correo = ENV.fetch("DIRECTIVO_CORREO")
    credencial = ENV.fetch("DIRECTIVO_CREDENCIAL_PROVISIONAL")

    directivo = Usuario.find_or_initialize_by(correo: correo)

    # RN-11 · reponer la credencial no toca el historial: la cuenta es la misma.
    directivo.assign_attributes(
      nombre: directivo.nombre.presence || "Equipo",
      apellido: directivo.apellido.presence || "Directivo",
      rol: "directivo",
      estado: "activo",
      contrasena: credencial,
      credencial_provisional: true
    )
    directivo.save!
    directivo
  end
end
