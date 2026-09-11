# RF-15 Vinculación de docentes a cursos · RF-44 Desvinculación y baja de docente ·
# CU-04 · RN-02, RN-13, RN-14
# Prueba: CP-RF-15 · CP-RF-03 · CP-RF-44
#
# Tabla 27 · POST /api/v1/cursos/{id}/docentes · directivo · «Vincular un docente al
# curso con su atributo de titularidad».
# Tabla 27 · DELETE /api/v1/cursos/{id}/docentes/{usuarioId} · directivo · «Desvincular
# al docente designando otro titular».
# Tabla 40 · POST: usuario_id, es_titular → recurso docente_curso. DELETE:
# titular_reemplazo_id, obligatorio si el desvinculado es titular → recurso
# docente_curso con vigente_hasta.
class VinculacionesDocentesController < ApplicationController
  # RN-02 · «El directivo … da de alta a los docentes y les asigna cursos.»
  autoriza :crear, roles: %w[directivo]
  # RN-13 · «El directivo desvincula y da de baja a los docentes.»
  autoriza :destruir, roles: %w[directivo]

  # CU-04 paso 3 · «el directivo lo vincula a uno o varios cursos, indicando en cada
  # vinculación si posee la atribución de titular».
  def crear
    curso = Curso.find(params[:id])
    docente = docente_a_vincular

    if curso.vinculaciones_docentes.vigentes.exists?(usuario_id: docente.id)
      raise ErrorDeDominio::DatosInaceptables.new(
        detalle: "El docente ya está vinculado a este curso."
      )
    end

    # Tabla 21 · «Un único titular vigente por curso». La Tabla 38 atribuye ese índice a
    # RN-13, que es la regla que mantiene la titularidad siempre definida: se rechaza con
    # 409 y la regla consignada, como la Tabla 35 manda para el conflicto con una regla.
    if parametros[:es_titular] && curso.vinculaciones_docentes.vigentes.titulares.exists?
      raise ErrorDeDominio::ConflictoDeRegla.new(
        regla: "RN-13", detalle: "El curso ya tiene un titular vigente."
      )
    end

    vinculacion = curso.vinculaciones_docentes.create!(
      docente: docente,
      es_titular: parametros[:es_titular],
      vigente_desde: Time.current.to_date
    )

    render json: vinculacion.recurso, status: :created
  end

  # CU-04 flujo A y E1 · RN-13 · RN-14
  def destruir
    curso = Curso.find(params[:id])
    vinculacion = curso.vinculaciones_docentes.vigentes.find_by!(usuario_id: params[:usuario_id])
    hoy = Time.current.to_date

    ActiveRecord::Base.transaction do
      # El curso se bloquea: dos desvinculaciones simultáneas del titular no pueden dejarlo
      # sin titular ni con dos.
      curso.lock!

      if vinculacion.es_titular
        reemplazo = vinculacion_del_reemplazo(curso, vinculacion)
        vinculacion.update!(vigente_hasta: hoy)
        # D-13 · el reemplazo asume la titularidad desde hoy: su vinculación se cierra y se
        # abre otra como titular, para que el historial conserve desde cuándo lo es.
        reemplazo.update!(vigente_hasta: hoy)
        curso.vinculaciones_docentes.create!(usuario_id: reemplazo.usuario_id, es_titular: true,
                                             vigente_desde: hoy)
      else
        vinculacion.update!(vigente_hasta: hoy)
      end
    end

    # RN-14 · la desvinculación no suprime nada: la autoría del docente se conserva.
    render json: vinculacion.reload.recurso, status: :ok
  end

  private

  # CU-04 E1 · «si el docente desvinculado era el titular del curso, la operación exige
  # designar otro titular en el mismo acto y se rechaza si no se lo designa». La Tabla 35
  # asigna 409 a CU-04 E1, con la regla consignada.
  def vinculacion_del_reemplazo(curso, desvinculada)
    reemplazo_id = params[:titular_reemplazo_id]
    if reemplazo_id.blank?
      raise ErrorDeDominio::ConflictoDeRegla.new(
        regla: "RN-13",
        detalle: "El docente es el titular del curso: debe designarse otro titular en el mismo acto."
      )
    end

    # D-13 · el reemplazo debe ser ya un docente vinculado al curso y habilitado.
    reemplazo = curso.vinculaciones_docentes.vigentes.find_by(usuario_id: reemplazo_id)
    if reemplazo.nil? || reemplazo.usuario_id == desvinculada.usuario_id || reemplazo.docente.estado_dado_de_baja?
      raise ErrorDeDominio::DatosInaceptables.new(
        detalle: "El reemplazo debe ser otro docente habilitado y vinculado a este curso."
      )
    end

    reemplazo
  end

  def parametros
    @parametros ||= begin
      p = params.permit(:usuario_id, :es_titular)
      if p[:usuario_id].blank? || !params.key?(:es_titular)
        raise ErrorDeDominio::DatosInaceptables.new(
          detalle: "Se requieren usuario_id y es_titular."
        )
      end
      { usuario_id: p[:usuario_id], es_titular: ActiveModel::Type::Boolean.new.cast(p[:es_titular]) }
    end
  end

  # Sólo se vincula a quien tiene el rol docente y no fue dado de baja (RN-04, RN-11).
  # El docente pendiente sí se vincula: CU-04 lo vincula antes de que active su cuenta.
  def docente_a_vincular
    docente = Usuario.find_by(id: parametros[:usuario_id], rol: "docente")
    if docente.nil? || docente.estado_dado_de_baja?
      raise ErrorDeDominio::DatosInaceptables.new(
        detalle: "El usuario indicado no es un docente habilitado."
      )
    end

    docente
  end
end
