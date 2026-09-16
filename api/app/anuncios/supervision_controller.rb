# RF-45 Consulta directiva del estado de la comunicación · CU-15 · RN-22
# Prueba: CP-RF-45
#
# Tabla 18 · GET /api/v1/supervision/cursos · directivo · «Consultar los anuncios de
# todos los cursos del año lectivo vigente y el estado agregado de entrega y lectura por
# curso».
# Tabla 29 · anio_lectivo_id (opcional, por omisión el año lectivo vigente) → por curso:
# cantidad de anuncios, enviadas, entregadas, vistas y leídas.
# GET /api/v1/supervision/conversaciones es RF-46 (Should have): no se construye acá.
# openapi/openapi.yaml · esquema EstadoPorCurso: «curso» es el recurso Curso completo
# (no «curso_id») y el conteo de anuncios se llama «anuncios» (no
# «cantidad_de_anuncios»). La respuesta envuelve `datos` con total/pagina/por_pagina
# conforme a specs/23-convenciones-api.md (Tabla 28): sin parámetros de paginación
# declarados para esta operación, se informa todo en una sola página.
class SupervisionController < ApplicationController
  # RN-22 · «El directivo accede a los anuncios de todos los cursos del año lectivo
  # vigente y a su estado agregado de entrega y lectura.»
  autoriza :cursos, roles: %w[directivo]

  # CU-15 · «agrega, por curso, las filas de entrega de los anuncios del año lectivo
  # vigente… devuelve el estado agregado de entrega y de lectura de cada curso.»
  def cursos
    anio_lectivo = anio_lectivo_de_la_consulta
    filas = Curso.where(anio_lectivo_id: anio_lectivo&.id).order(:nombre).map { |curso| fila_de(curso) }

    render json: { datos: filas, total: filas.size, pagina: 1, por_pagina: 25 }, status: :ok
  end

  private

  def anio_lectivo_de_la_consulta
    return AnioLectivo.find(params[:anio_lectivo_id]) if params[:anio_lectivo_id].present?

    AnioLectivo.estado_vigente.first
  end

  # RN-22 · el estado agregado se computa sobre las entregas de los alumnos y tutores
  # de ESTE curso, la misma comunidad que RN-16 resuelve como destinatarios al
  # publicar: un anuncio dirigido a varios cursos aporta a cada uno el recuento de su
  # propia comunidad, no una única fila que uno de los cursos se atribuya entero.
  def fila_de(curso)
    anuncios = Anuncio.joins(:vinculaciones_curso).where(anuncio_curso: { curso_id: curso.id }).distinct
    version_ids = anuncios.filter_map { |anuncio| anuncio.version_vigente&.id }

    alumno_ids = AlumnoCurso.vigentes.where(curso_id: curso.id).pluck(:usuario_id)
    tutor_ids = TutorAlumno.vigentes.where(alumno_id: alumno_ids).pluck(:tutor_id)
    entregas = EntregaAnuncio.where(anuncio_version_id: version_ids, destinatario_id: alumno_ids + tutor_ids)

    {
      "curso" => curso.recurso,
      "anuncios" => anuncios.count,
      "enviadas" => entregas.count,
      "entregadas" => entregas.where.not(entregada_en: nil).count,
      "vistas" => entregas.where.not(vista_en: nil).count,
      "leidas" => entregas.where.not(leida_en: nil).count
    }
  end
end
