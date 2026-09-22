# RF-17 Publicación de anuncios · RF-20 Borrado lógico de anuncios · RF-21 Resolución de
# destinatarios · RF-22 Consulta del historial de anuncios · RF-23 Panel de constancias
# del docente · CU-06, CU-08, CU-09, CU-11 · RN-14, RN-15, RN-16, RN-17, RN-19, RN-20,
# RN-21, RN-22, RN-27, RN-28
# Prueba: CP-RF-17 · CP-RF-20 · CP-RF-21 · CP-RF-22 · CP-RF-23
#
# Tabla 18 · POST /api/v1/anuncios · docente · «Publicar un anuncio sobre uno o varios
# de sus cursos». DELETE /api/v1/anuncios/{id} · docente autor · «Eliminar un anuncio
# propio». GET /api/v1/anuncios y GET /api/v1/anuncios/{id} · directivo, docente, tutor,
# alumno · «Consultar el historial de anuncios que corresponde al rol». GET
# /api/v1/anuncios/{id}/constancias · docente autor · «Consultar el recuento de
# lecturas y la nómina de quienes no leyeron».
# Tabla 29 · titulo, cuerpo, cursos (lista de ids) → recurso anuncio. DELETE: sin cuerpo
# → recurso anuncio con eliminado_en y eliminado_por. GET índice: curso_id,
# remitente_id, desde, hasta, pagina, por_pagina → colección con titulo, publicado_en,
# autor (recurso completo) y leido de quien consulta. GET detalle: sin parámetros →
# recurso anuncio con su versión vigente, sus cursos (recurso completo) y sus adjuntos.
# GET constancias: pagina, por_pagina → total de destinatarios, cantidad con lectura
# registrada y nómina paginada de alumnos sin lectura registrada.
# openapi/openapi.yaml (esquemas AnuncioEnBandeja, AnuncioDetalle, Constancias) y la
# Tabla 28 (paginación con total/pagina/por_pagina y orden por fecha descendente por
# omisión) fijan estas formas.
# RF-38 (familia alcanzada), Should have (Tabla 10): la respuesta de constancias no
# incluye ese indicador.
# RF-18 (programación) es Should have (Tabla 10): sólo se construye la publicación
# inmediata, «el caso ordinario y el único comprometido» (punto 4.2, semántica
# temporal). `programado_para` y `adjuntos` (RF-18 y RF-30, Should have) no se admiten:
# se descartan en `parametros` como cualquier clave no permitida.
# RF-19 (edición con versionado) es Should have (Tabla 10): mientras no se incorpore,
# la corrección de un anuncio se resuelve como eliminación lógica (RF-20) y publicación
# nueva (RF-17). No hay, por eso, ninguna acción `actualizar` ni ruta PATCH en este
# controlador: RF-21 queda enteramente cubierto por `crear` (resolución inicial) y por
# la secuencia `destruir` + `crear` (resolución de reemplazo), sin una tercera vía que
# RF-19 todavía no habilita.
class AnunciosController < ApplicationController
  # RN-16 · «Los anuncios los publica el docente…»
  autoriza :crear, roles: %w[docente]
  # Tabla 18 · «docente autor»: el rol es docente; que sea el autor lo verifica dentro
  # de la acción, con 403 (specs/support/inventario.rb).
  autoriza :destruir, roles: %w[docente]
  # RN-15 · acceso mediado, sobre los cuatro roles.
  autoriza :index, roles: %w[directivo docente tutor alumno]
  autoriza :mostrar, roles: %w[directivo docente tutor alumno]
  # RN-21 · «El docente ve, por anuncio, cuántos leyeron… Tutores y alumnos no ven la
  # constancia de nadie más.» Tabla 18 · «docente autor»: la autoría se verifica en la
  # acción, con 403.
  autoriza :constancias, roles: %w[docente]

  # CU-06 (Tabla 13): publicación inmediata, la única comprometida.
  def crear
    cursos_ids = parametros[:cursos]
    verificar_vinculacion!(cursos_ids)

    anuncio = nil
    entregas = []

    ActiveRecord::Base.transaction do
      anuncio = Anuncio.create!(autor: usuario_actual, estado: "publicado", creado_en: Time.current)
      cursos_ids.each { |curso_id| anuncio.vinculaciones_curso.create!(curso_id: curso_id) }

      version = anuncio.versiones.create!(
        numero_version: 1, titulo: parametros[:titulo], cuerpo: parametros[:cuerpo],
        publicado_en: Time.current
      )

      # RN-19 · destinatarios resueltos en este instante, no en la redacción.
      destinatario_ids = resolver_destinatarios(cursos_ids)
      entregas = destinatario_ids.map do |destinatario_id|
        # specs/25-semantica-temporal.md · «la fila nace con el canal establecido en la
        # aplicación y sin causa registrada».
        version.entregas.create!(
          destinatario_id: destinatario_id, canal: "aplicacion", enviada_en: Time.current
        )
      end
    end

    # RF-31 · encola el envío push de cada notificación (sin construir).
    entregas.each { |entrega| NotificacionAnuncioJob.perform_later(entrega.id) }

    render json: anuncio.recurso(destinatarios_resueltos: entregas.size), status: :created
  end

  # RN-20 · «El borrado de un anuncio es lógico, con registro de autor y fecha, y
  # conserva las filas de entrega.» No se toca entrega_anuncio: al no tocarla, se
  # conserva.
  def destruir
    anuncio = Anuncio.find(params[:id])

    # CU-08 E1 (Tabla 24, fila 403): rechaza la eliminación de un anuncio del que el
    # docente no es autor.
    unless anuncio.autor_id == usuario_actual.id
      raise ErrorDeDominio::NoHabilitado.new(
        codigo: "no_es_autor", detalle: "Sólo el autor del anuncio puede eliminarlo."
      )
    end

    # RN-11 (baja lógica en general) · idempotente, igual que BajaLogica: repetir la
    # eliminación no reescribe la fecha ni el autor ya registrados.
    unless anuncio.estado_eliminado?
      anuncio.update!(estado: "eliminado", eliminado_en: Time.current, eliminado_por: usuario_actual.id)
    end

    render json: anuncio.recurso_eliminado, status: :ok
  end

  # CU-09 (Tabla 13): filtra y devuelve únicamente los anuncios que corresponden al
  # rol y a las vinculaciones vigentes de quien consulta. Tabla 28 · «el historial de
  # anuncios… ordena por fecha descendente por omisión»; admite `orden=publicado_en:asc`
  # para invertirlo.
  def index
    pagina = [ params[:pagina].to_i, 1 ].max
    por_pagina = params[:por_pagina].to_i
    por_pagina = 25 if por_pagina <= 0
    por_pagina = [ por_pagina, 100 ].min
    sentido = params[:orden].to_s == "publicado_en:asc" ? "ASC" : "DESC"

    # RF-20 · la eliminación es lógica: el anuncio eliminado conserva su registro y sus
    # entregas, pero deja de presentarse en el historial. Su detalle sigue consultable.
    relacion = filtrar(alcance_del_rol.where.not(estado: "eliminado")).order(Arel.sql(<<~SQL.squish))
      (SELECT av.publicado_en FROM anuncio_version av
        WHERE av.anuncio_id = anuncio.id ORDER BY av.numero_version DESC LIMIT 1) #{sentido}
    SQL
    datos = relacion.offset((pagina - 1) * por_pagina).limit(por_pagina)

    render json: {
      datos: datos.map { |anuncio| fila_de_indice(anuncio) },
      total: relacion.count, pagina: pagina, por_pagina: por_pagina
    }, status: :ok
  end

  # CU-09 (Tabla 13). E1 (Tabla 24, fila 404): un anuncio ajeno a las vinculaciones de
  # quien consulta responde 404, con independencia de lo que el cliente presente.
  def mostrar
    anuncio = alcance_del_rol.find_by(id: params[:id])
    raise ErrorDeDominio::NoEncontrado.new if anuncio.nil?

    render json: anuncio.recurso_detalle, status: :ok
  end

  # RN-21 · recuento de lecturas sobre la publicación vigente y nómina paginada de
  # quienes no leyeron. E1 (Tabla 24, fila 403) si el docente no es autor. La familia
  # alcanzada depende de RF-38, Should have: no se calcula acá.
  def constancias
    anuncio = Anuncio.find(params[:id])
    unless anuncio.autor_id == usuario_actual.id
      raise ErrorDeDominio::NoHabilitado.new(
        codigo: "no_es_autor", detalle: "Sólo el autor del anuncio puede consultar sus constancias."
      )
    end

    pagina = [ params[:pagina].to_i, 1 ].max
    por_pagina = params[:por_pagina].to_i
    por_pagina = 25 if por_pagina <= 0
    por_pagina = [ por_pagina, 100 ].min

    # openapi/openapi.yaml · esquema Constancias: «sin_lectura» devuelve el nombre del
    # alumno, no el de cada tutor por separado. Un tutor que no leyó no aparece acá: su
    # familia figura por el lado del alumno, con RF-38 (familia_alcanzada, Should have)
    # todavía sin construir.
    entregas = anuncio.version_vigente.entregas
    alumnos_sin_leer = Usuario.alumno
                              .where(id: entregas.where(leida_en: nil).select(:destinatario_id))
                              .order(:apellido, :nombre)
    pagina_actual = alumnos_sin_leer.offset((pagina - 1) * por_pagina).limit(por_pagina)

    render json: {
      total_destinatarios: entregas.count,
      con_lectura_registrada: entregas.where.not(leida_en: nil).count,
      sin_lectura: pagina_actual.map { |alumno| { "alumno" => alumno.slice(:id, :nombre, :apellido) } },
      total: alumnos_sin_leer.count, pagina: pagina, por_pagina: por_pagina
    }, status: :ok
  end

  private

  # RN-16 · si el docente no está vinculado a alguno de los cursos seleccionados, la
  # operación se rechaza sin efectos parciales. Se verifica antes de escribir nada, y no
  # dentro de la transacción, para que el rechazo no dependa de una reversión. Un curso
  # inexistente se trata igual que uno ajeno (403 y no 404), para no revelar su
  # existencia, conforme a la fila del 403 de la Tabla 24.
  def verificar_vinculacion!(cursos_ids)
    return if cursos_ids.all? { |curso_id| usuario_actual.dicta_curso?(curso_id) }

    raise ErrorDeDominio::NoHabilitado.new(
      codigo: "docente_no_vinculado_al_curso",
      detalle: "El docente no está vinculado a alguno de los cursos seleccionados."
    )
  end

  # RN-16 · «dirigidos a los tutores y alumnos de sus cursos.» Los tutores de esos
  # alumnos se agregan porque RF-17 nombra a ambos como destinatarios.
  # RN-19 · RF-21 · se resuelve en este instante, sobre las vinculaciones vigentes: quien
  # se incorpora al curso después no recibe esta publicación (CP-RF-21), porque esta
  # consulta ya corrió y no vuelve a ejecutarse para esa publicación.
  def resolver_destinatarios(cursos_ids)
    alumno_ids = AlumnoCurso.vigentes.where(curso_id: cursos_ids).distinct.pluck(:usuario_id)
    tutor_ids = TutorAlumno.vigentes.where(alumno_id: alumno_ids).distinct.pluck(:tutor_id)
    (alumno_ids + tutor_ids).uniq
  end

  # RN-22 · el directivo accede a los de todos los cursos del año lectivo vigente. El
  # docente, a los de los cursos que dicta. El tutor y el alumno, a aquellos donde
  # tienen una fila de entrega —la misma resolución de RN-19, que ya excluye lo
  # publicado antes de vincularse (RF-21).
  # Por subconsulta (`where(id: …)`) y no por join+distinct: el índice ordena por la
  # fecha de publicación con una subconsulta propia (más abajo), y Postgres rechaza
  # combinar `SELECT DISTINCT` con un `ORDER BY` que no figure en la lista de columnas
  # seleccionadas.
  def alcance_del_rol
    case usuario_actual.rol
    when "directivo"
      cursos_vigentes = Curso.where(anio_lectivo_id: AnioLectivo.where(estado: "vigente").select(:id))
      Anuncio.where(id: AnuncioCurso.where(curso_id: cursos_vigentes.select(:id)).select(:anuncio_id))
    when "docente"
      Anuncio.where(id: AnuncioCurso.where(curso_id: usuario_actual.cursos_vigentes_como_docente)
                                    .select(:anuncio_id))
    else
      entregas_propias = EntregaAnuncio.where(destinatario_id: usuario_actual.id).select(:anuncio_version_id)
      Anuncio.where(id: AnuncioVersion.where(id: entregas_propias).select(:anuncio_id))
    end
  end

  # RF-22 · filtra por fecha, curso o remitente, dentro del alcance ya resuelto.
  def filtrar(relacion)
    relacion = relacion.where(autor_id: params[:remitente_id]) if params[:remitente_id].present?
    if params[:curso_id].present?
      relacion = relacion.where(id: AnuncioCurso.where(curso_id: params[:curso_id]).select(:anuncio_id))
    end
    if params[:desde].present? || params[:hasta].present?
      versiones = AnuncioVersion.all
      versiones = versiones.where(publicado_en: params[:desde]..) if params[:desde].present?
      versiones = versiones.where(publicado_en: ..params[:hasta]) if params[:hasta].present?
      relacion = relacion.where(id: versiones.select(:anuncio_id))
    end
    relacion
  end

  # openapi/openapi.yaml · esquema AnuncioEnBandeja: id, titulo, publicado_en, autor (el
  # recurso Usuario completo, no sólo su id), leido (booleano) y anuncio_version_id, el
  # identificador de la publicación vigente con que el cliente emite las vistas de RF-35
  # agrupadas (POST /entregas/vistas). El directivo no es
  # destinatario de ninguno: su entrega propia no existe, y leido queda en falso.
  def fila_de_indice(anuncio)
    version = anuncio.version_vigente
    entrega_propia = version.entregas.find_by(destinatario_id: usuario_actual.id)
    {
      "id" => anuncio.id, "anuncio_version_id" => version.id, "titulo" => version.titulo,
      "publicado_en" => version.publicado_en, "autor" => anuncio.autor.recurso,
      "leido" => entrega_propia&.leida_en.present?
    }
  end

  def parametros
    p = params.permit(:titulo, :cuerpo, cursos: [])
    cursos = Array(p[:cursos]).uniq
    faltantes = []
    faltantes << "titulo" if p[:titulo].blank?
    faltantes << "cuerpo" if p[:cuerpo].blank?
    faltantes << "cursos" if cursos.empty?
    if faltantes.any?
      raise ErrorDeDominio::DatosInaceptables.new(
        detalle: "Faltan campos obligatorios: #{faltantes.join(', ')}."
      )
    end

    { titulo: p[:titulo], cuerpo: p[:cuerpo], cursos: cursos }
  end
end
