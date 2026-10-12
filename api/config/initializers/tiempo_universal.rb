# Tabla 39 · «Cadena conforme a ISO 8601 con desplazamiento explícito. El servidor
# almacena y responde en tiempo universal coordinado.»
# Punto 4.2 · America/Asuncion es la zona de INTERPRETACIÓN de las horas de pared, no la
# de respuesta: toda marca de tiempo sale de la interfaz en UTC, con el designador «Z».
module RespuestaEnTiempoUniversal
  def as_json(*)
    utc.as_json
  end
end

ActiveSupport::TimeWithZone.prepend(RespuestaEnTiempoUniversal)
