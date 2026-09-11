# RF-09 Baja lógica de alumnos y tutores · RF-10 · CU-05 flujo B y E3 · RN-10, RN-11,
# RN-12
# Prueba: CP-RF-09 · CP-RF-10
#
# Tabla 27 · DELETE /api/v1/tutores/{id} · «Directivo, docente titular».
# Tabla 40 · sin cuerpo → recurso usuario con estado dado de baja.
class TutoresController < ApplicationController
  # La titularidad la decide PotestadDeBaja (RN-10).
  autoriza :destruir, roles: %w[directivo docente]

  def destruir
    tutor = Usuario.tutor.find(params[:id])

    render json: BajaLogica.ejecutar(persona: tutor, por: usuario_actual).recurso, status: :ok
  end
end
