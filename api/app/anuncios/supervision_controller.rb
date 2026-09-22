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
  # Las mismas cifras de antes, en dos consultas por curso en lugar de una por anuncio (RNF-09).
  # Destinatarios: los alumnos con vinculación vigente al curso y los tutores vigentes de
  # ellos. Versión vigente de cada anuncio: la de mayor número.
  def fila_de(curso)
    anuncios = Anuncio.joins(:vinculaciones_curso).where(anuncio_curso: { curso_id: curso.id }).distinct.count
    conteos = Curso.connection.select_one(Curso.sanitize_sql([ <<~SQL.squish, { curso_id: curso.id } ]))
      WITH alumnos AS (
        SELECT usuario_id FROM alumno_curso WHERE curso_id = :curso_id AND vigente_hasta IS NULL
      ), destinatarios AS (
        SELECT usuario_id AS id FROM alumnos
        UNION
        SELECT tutor_id FROM tutor_alumno
         WHERE vigente_hasta IS NULL AND alumno_id IN (SELECT usuario_id FROM alumnos)
      ), versiones AS (
        SELECT DISTINCT ON (v.anuncio_id) v.id
          FROM anuncio_version v JOIN anuncio_curso ac ON ac.anuncio_id = v.anuncio_id
         WHERE ac.curso_id = :curso_id
         ORDER BY v.anuncio_id, v.numero_version DESC
      )
      SELECT COUNT(*) AS enviadas, COUNT(e.entregada_en) AS entregadas,
             COUNT(e.vista_en) AS vistas, COUNT(e.leida_en) AS leidas
        FROM entrega_anuncio e
       WHERE e.anuncio_version_id IN (SELECT id FROM versiones)
         AND e.destinatario_id IN (SELECT id FROM destinatarios)
    SQL

    {
      "curso" => curso.recurso,
      "anuncios" => anuncios,
      "enviadas" => conteos["enviadas"],
      "entregadas" => conteos["entregadas"],
      "vistas" => conteos["vistas"],
      "leidas" => conteos["leidas"]
    }
  end
end
