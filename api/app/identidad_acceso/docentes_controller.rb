# RF-03 Alta de docentes y asignación a cursos · CU-04 · RN-01, RN-02, RN-05
# Prueba: CP-RF-03
#
# Tabla 27 · POST /api/v1/docentes · directivo · «Dar de alta a un docente y generar su
# código» · RF-03, RF-05.
class DocentesController < ApplicationController
  # RN-02 · «El directivo … da de alta a los docentes y les asigna cursos.»
  autoriza :crear, roles: %w[directivo]

  # CU-04 pasos 1 y 2 · «el directivo registra al docente, que en ningún caso se
  # autorregistra; el sistema genera su código de activación de un solo uso, con
  # vencimiento de siete días». La vinculación con los cursos (paso 3) es
  # POST /cursos/{id}/docentes.
  def crear
    alta = RegistroDePersona.registrar(**parametros, rol: "docente", registrado_por: usuario_actual)

    # Tabla 40 y D-10 · recurso usuario y codigo_activacion con vence_en, con el código
    # en claro devuelto una sola vez.
    render json: {
      usuario: alta.usuario.recurso,
      codigo_activacion: alta.codigo_activacion.representacion(codigo_en_claro: alta.codigo_en_claro)
    }, status: :created
  end

  private

  def parametros
    p = params.permit(:nombre, :apellido, :correo)
    faltantes = %i[nombre apellido correo].select { |campo| p[campo].blank? }
    if faltantes.any?
      raise ErrorDeDominio::DatosInaceptables.new(
        detalle: "Faltan campos obligatorios: #{faltantes.join(', ')}."
      )
    end

    p.to_h.symbolize_keys
  end
end
