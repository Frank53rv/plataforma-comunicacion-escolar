# RF-17 Publicación de anuncios · RF-20 Borrado lógico de anuncios · RF-21 Resolución de
# destinatarios · CU-06, CU-08 · RN-14, RN-16, RN-17, RN-19, RN-20
# Prueba: CP-RF-17 · CP-RF-20 · CP-RF-21
#
# Tabla 18 · POST /api/v1/anuncios · docente · «Publicar un anuncio sobre uno o varios
# de sus cursos». DELETE /api/v1/anuncios/{id} · docente autor · «Eliminar un anuncio
# propio».
# Tabla 29 · titulo, cuerpo, cursos (lista de ids) → recurso anuncio. DELETE: sin cuerpo
# → recurso anuncio con eliminado_en y eliminado_por.
# D-05 · la operación de creación es Must have aunque uno de sus requisitos (RF-18,
# programación) es Should have: este incremento sólo construye la publicación
# inmediata, que specs/25-semantica-temporal.md fija como «el caso ordinario y el único
# comprometido». `programado_para` y `adjuntos` (RF-18 y RF-30, ambos Should have) no se
# admiten: se descartan en `parametros` como cualquier clave no permitida.
# CU-07 flujo alternativo A · «mientras RF-19 permanezca clasificado como Should have,
# la corrección de un anuncio se resuelve como eliminación lógica conforme a CU-08 y
# publicación nueva conforme a CU-06». No hay, por eso, ninguna acción `actualizar` ni
# ruta PATCH en este controlador: RF-21 («inicial o de reemplazo») queda enteramente
# cubierto por `crear` (resolución inicial) y por la secuencia `destruir` + `crear`
# (resolución de reemplazo), sin una tercera vía que RF-19 todavía no habilita.
class AnunciosController < ApplicationController
  # RN-16 · «Los anuncios los publica el docente…»
  autoriza :crear, roles: %w[docente]
  # Tabla 27 · «docente autor»: el rol es docente; que sea el autor lo verifica CU-08 E1
  # con 403, dentro de la acción (specs/support/inventario.rb).
  autoriza :destruir, roles: %w[docente]

  # CU-06 flujo principal (1)-(6) · publicación inmediata, la única comprometida.
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

    # CU-06 paso 6 · encola el envío push de cada notificación (RF-31, sin construir).
    entregas.each { |entrega| NotificacionAnuncioJob.perform_later(entrega.id) }

    render json: anuncio.recurso(destinatarios_resueltos: entregas.size), status: :created
  end

  # CU-08 · «el docente solicita la eliminación… el sistema marca el anuncio como
  # eliminado y registra el autor y la fecha… las filas de entrega asociadas se
  # conservan.» No se toca entrega_anuncio: al no tocarla, se conserva.
  def destruir
    anuncio = Anuncio.find(params[:id])

    # CU-08 E1 · «se rechaza la eliminación de un anuncio del que el docente no es
    # autor.»
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

  private

  # CU-06 paso 3 y E1 · «si el docente no está vinculado a alguno de los cursos
  # seleccionados, la operación se rechaza sin efectos parciales». Se verifica antes de
  # escribir nada, y no dentro de la transacción, para que el rechazo no dependa de una
  # reversión. Un curso inexistente se trata igual que uno ajeno (403 y no 404), para no
  # revelar su existencia, conforme al criterio ya registrado en D-15 para las altas.
  def verificar_vinculacion!(cursos_ids)
    return if cursos_ids.all? { |curso_id| usuario_actual.dicta_curso?(curso_id) }

    raise ErrorDeDominio::NoHabilitado.new(
      codigo: "docente_no_vinculado_al_curso",
      detalle: "El docente no está vinculado a alguno de los cursos seleccionados."
    )
  end

  # RN-16 · «dirigidos a los tutores y alumnos de sus cursos.» Los tutores de esos
  # alumnos se agregan porque CU-06 nombra a ambos como destinatarios.
  # RN-19 · RF-21 · se resuelve en este instante, sobre las vinculaciones vigentes: quien
  # se incorpora al curso después no recibe esta publicación (CP-RF-21), porque esta
  # consulta ya corrió y no vuelve a ejecutarse para esa publicación.
  def resolver_destinatarios(cursos_ids)
    alumno_ids = AlumnoCurso.vigentes.where(curso_id: cursos_ids).distinct.pluck(:usuario_id)
    tutor_ids = TutorAlumno.vigentes.where(alumno_id: alumno_ids).distinct.pluck(:tutor_id)
    (alumno_ids + tutor_ids).uniq
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
