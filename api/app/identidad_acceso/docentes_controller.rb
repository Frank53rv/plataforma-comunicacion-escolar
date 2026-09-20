# RF-03 Alta de docentes y asignación a cursos · RF-44 Desvinculación y baja de docente ·
# CU-04 · RN-01, RN-02, RN-05, RN-11, RN-13, RN-14
# Prueba: CP-RF-03 · CP-RF-44
#
# Tabla 27 · POST /api/v1/docentes · directivo · «Dar de alta a un docente y generar su
# código» · RF-03, RF-05.
# Tabla 27 · DELETE /api/v1/docentes/{id} · directivo · «Dar de baja lógica a un
# docente» · RF-44.
class DocentesController < ApplicationController
  # RN-02 · «El directivo … da de alta a los docentes y les asigna cursos.»
  autoriza :crear, roles: %w[directivo]
  # RN-13 · «El directivo desvincula y da de baja a los docentes.»
  autoriza :destruir, roles: %w[directivo]

  # RF-03, RF-05 · el directivo registra al docente, que en ningún caso se
  # autorregistra; el sistema genera su código de activación de un solo uso, con
  # vencimiento de siete días. La vinculación con los cursos (RF-15) es
  # POST /cursos/{id}/docentes.
  def crear
    alta = RegistroDePersona.registrar(**parametros, rol: "docente", registrado_por: usuario_actual)

    # Tabla 29 · recurso usuario y codigo_activacion con vence_en, con el código
    # en claro devuelto una sola vez.
    render json: {
      usuario: alta.usuario.recurso,
      codigo_activacion: alta.codigo_activacion.representacion(codigo_en_claro: alta.codigo_en_claro)
    }, status: :created
  end

  # Tabla 40 · sin cuerpo → recurso usuario con estado dado de baja.
  def destruir
    docente = Usuario.docente.find(params[:id])

    # Primero se desvincula, después se da de baja: la baja no lleva cuerpo y no
    # puede designar reemplazo, y el curso no puede quedar con un titular sin acceso
    # (CU-04, «la titularidad del curso siempre definida»).
    if DocenteCurso.vigentes.exists?(usuario_id: docente.id)
      raise ErrorDeDominio::ConflictoDeRegla.new(
        regla: "RN-13",
        detalle: "El docente mantiene vinculaciones vigentes: debe desvincularse antes de cada curso."
      )
    end

    # RN-11 · baja lógica. RN-14 · sus anuncios y mensajes, y sus constancias, se
    # conservan con su autoría histórica: nada se suprime.
    docente.update!(estado: "dado_de_baja") unless docente.estado_dado_de_baja?

    render json: docente.recurso, status: :ok
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
