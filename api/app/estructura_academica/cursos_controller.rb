# RF-12 Administración de cursos · CU-03 · RN-02, RN-26
# Prueba: CP-RF-12
#
# Tabla 18 · POST /api/v1/cursos y PATCH /api/v1/cursos/{id} · directivo · «Crear y
# editar cursos dentro del año lectivo vigente».
# Tabla 18 · GET /api/v1/cursos · directivo, docente · el docente ve únicamente
# sus propios cursos, igual que en el resto de sus operaciones (RN-03, RN-07).
# Tabla 29 · POST: anio_lectivo_id, nombre, turno → recurso curso. PATCH: nombre, turno
# → recurso curso. GET: anio_lectivo_id y estado opcionales → colección paginada.
class CursosController < ApplicationController
  # RN-02 · «El directivo crea el año lectivo y los cursos…»
  autoriza :crear, roles: %w[directivo]
  autoriza :actualizar, roles: %w[directivo]
  autoriza :index, roles: %w[directivo docente]

  # RF-12 · crea, dentro del año lectivo vigente, los cursos con su nombre y su turno.
  def crear
    anio_lectivo = AnioLectivo.find(parametros[:anio_lectivo_id])
    Curso.verificar_nombre_disponible!(anio_lectivo_id: anio_lectivo.id, nombre: parametros[:nombre])

    curso = Curso.create!(anio_lectivo: anio_lectivo, nombre: parametros[:nombre],
                           turno: parametros[:turno], estado: "vigente")

    render json: curso.recurso, status: :created
  end

  # RF-12 · edita los cursos existentes mientras el año lectivo permanezca vigente.
  def actualizar
    curso = Curso.find(params[:id])
    cambios = params.permit(:nombre, :turno).to_h.symbolize_keys

    if cambios[:nombre].present?
      Curso.verificar_nombre_disponible!(
        anio_lectivo_id: curso.anio_lectivo_id, nombre: cambios[:nombre], excepto_id: curso.id
      )
    end

    curso.update!(cambios)

    render json: curso.recurso, status: :ok
  end

  # Tabla 28 · colección paginada: datos, total, pagina y por_pagina.
  def index
    pagina = [ params[:pagina].to_i, 1 ].max
    por_pagina = params[:por_pagina].to_i
    por_pagina = 25 if por_pagina <= 0
    por_pagina = [ por_pagina, 100 ].min

    relacion = alcance_del_rol
    relacion = relacion.where(anio_lectivo_id: params[:anio_lectivo_id]) if params[:anio_lectivo_id].present?
    relacion = relacion.where(estado: params[:estado]) if params[:estado].present?
    relacion = relacion.order(:nombre)

    datos = relacion.offset((pagina - 1) * por_pagina).limit(por_pagina)

    # La nómina de cada curso (NominaDeCursos): con ella el cliente conoce a las personas que
    # administra sin que la Tabla 18 tenga una operación que las lea.
    nomina = NominaDeCursos.para(datos.to_a)
    render json: {
      datos: datos.map { |curso| curso.recurso.merge(nomina.fetch(curso.id)) },
      total: relacion.count,
      pagina: pagina,
      por_pagina: por_pagina
    }, status: :ok
  end

  private

  def parametros
    p = params.permit(:anio_lectivo_id, :nombre, :turno)
    faltantes = %i[anio_lectivo_id nombre turno].select { |campo| p[campo].blank? }
    if faltantes.any?
      raise ErrorDeDominio::DatosInaceptables.new(
        detalle: "Faltan campos obligatorios: #{faltantes.join(', ')}."
      )
    end

    p.to_h.symbolize_keys
  end

  # El directivo ve la totalidad de los cursos; el docente, únicamente aquellos a
  # los que tiene una vinculación vigente, igual que en toda otra operación suya.
  def alcance_del_rol
    return Curso.all if usuario_actual.rol == "directivo"

    Curso.where(id: usuario_actual.cursos_vigentes_como_docente)
  end
end
