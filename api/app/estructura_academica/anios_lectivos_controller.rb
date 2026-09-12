# RF-11 Creación del año lectivo · CU-03 · RN-02, RN-31
# Prueba: CP-RF-11
#
# Tabla 18 · POST /api/v1/anios-lectivos · directivo · «Crear el año lectivo».
# Tabla 18 · GET /api/v1/anios-lectivos · directivo · «Consultar los años lectivos».
# Tabla 29 · POST: anio → recurso anio_lectivo. GET: sin parámetros → colección.
class AniosLectivosController < ApplicationController
  # RN-02 · «El directivo crea el año lectivo y los cursos…»
  autoriza :crear, roles: %w[directivo]
  autoriza :index, roles: %w[directivo]

  # CU-03 paso 1 · «el directivo crea el año lectivo, que queda en estado vigente».
  # Flujo de excepción E1 · «la creación de un segundo año lectivo en estado vigente se
  # rechaza mientras el anterior no se cierre» → 409 con RN-31 (Tabla 24, fila CU-03 E1).
  def crear
    if AnioLectivo.estado_vigente.exists?
      raise ErrorDeDominio::ConflictoDeRegla.new(
        regla: "RN-31",
        detalle: "Ya existe un año lectivo vigente: debe cerrarse antes de abrir otro."
      )
    end

    anio_lectivo = AnioLectivo.create!(**parametros, estado: "vigente", abierto_en: Time.current)

    render json: anio_lectivo.recurso, status: :created
  end

  # Tabla 28 · colección paginada: datos, total, pagina y por_pagina.
  def index
    pagina = [ params[:pagina].to_i, 1 ].max
    por_pagina = params[:por_pagina].to_i
    por_pagina = 25 if por_pagina <= 0
    por_pagina = [ por_pagina, 100 ].min

    relacion = AnioLectivo.order(anio: :asc)
    datos = relacion.offset((pagina - 1) * por_pagina).limit(por_pagina)

    render json: {
      datos: datos.map(&:recurso),
      total: relacion.count,
      pagina: pagina,
      por_pagina: por_pagina
    }, status: :ok
  end

  private

  def parametros
    p = params.permit(:anio)
    raise ErrorDeDominio::DatosInaceptables.new(detalle: "Falta el campo obligatorio: anio.") if p[:anio].blank?

    { anio: p[:anio] }
  end
end
