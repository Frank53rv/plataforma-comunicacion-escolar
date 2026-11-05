# Quality Spec, Tabla 28, fila «Manejo de excepciones» · Boundary 6
# Un único manejador central que traduce toda excepción al formato de la Tabla 26.
# Ningún controlador emite un cuerpo de error propio.
#
# Tabla 30 · la respuesta de error es un objeto conforme a RFC 9457 con los miembros de
# la norma más «codigo» y «regla», según el catálogo de la Tabla 26.
#
# Boundary 6 · ningún cuerpo de error revela detalle interno: el 500 se registra en la
# bitácora y responde con una descripción genérica.
#
# Prueba: CP-RNF-17
module ManejadorDeErrores
  extend ActiveSupport::Concern

  TIPO_CONTENIDO = "application/problem+json".freeze

  TITULOS = {
    401 => "No autenticado",
    403 => "No habilitado",
    404 => "No encontrado",
    409 => "Conflicto con una regla de negocio",
    410 => "Código no vigente",
    413 => "Adjunto demasiado grande",
    415 => "Formato no admitido",
    422 => "Datos inaceptables",
    500 => "Error interno"
  }.freeze

  included do
    rescue_from StandardError,                     with: :responder_error_interno
    # Las subclases de StatementInvalid que siguen más abajo tienen su propio manejador.
    rescue_from ActiveRecord::StatementInvalid,    with: :responder_error_de_sentencia
    rescue_from ErrorDeDominio,                    with: :responder_error_de_dominio
    rescue_from ActiveRecord::RecordNotFound,      with: :responder_no_encontrado
    rescue_from ActiveRecord::RecordInvalid,       with: :responder_datos_inaceptables
    # La unicidad que el diccionario declara —el correo, por ejemplo— la valida el
    # modelo; si dos peticiones simultáneas la violan, el motor la rechaza y el dato es
    # el mismo dato inaceptable, no un fallo interno.
    rescue_from ActiveRecord::RecordNotUnique,     with: :responder_datos_inaceptables
    # Un dato que excede la longitud que la Tabla 29 declara para su columna es un dato
    # inaceptable (422), no un «fallo no previsto» (500).
    rescue_from ActiveRecord::ValueTooLong,        with: :responder_datos_inaceptables
    rescue_from ActionController::ParameterMissing, with: :responder_datos_inaceptables
    # Un cuerpo que no es JSON válido o un valor que el motor no admite como dato (un
    # número fuera de rango, un texto que no es un valor del enum) no es un fallo no previsto.
    rescue_from ActionDispatch::Http::Parameters::ParseError, with: :responder_datos_inaceptables
    rescue_from ActionController::BadRequest,      with: :responder_datos_inaceptables
  end

  # Cuerpo de error conforme a RFC 9457 con «codigo» y «regla»; lo emite el controlador y
  # también la aplicación de excepciones, para lo que no llega a un controlador.
  def self.cuerpo(estado:, codigo:, detalle:, instancia:, regla: nil)
    cuerpo = {
      type: "about:blank",
      title: TITULOS.fetch(estado),
      status: estado,
      detail: detalle,
      instance: instancia,
      codigo: codigo
    }
    cuerpo[:regla] = regla if regla.present?
    cuerpo
  end

  ERRORES_DE_DATO_DEL_MOTOR = [ PG::InvalidTextRepresentation, PG::NumericValueOutOfRange ].freeze

  private

  def responder_error_de_dominio(error)
    responder(estado: error.estado, codigo: error.codigo,
              detalle: error.detalle, regla: error.regla)
  end

  def responder_no_encontrado(_error)
    responder_error_de_dominio(ErrorDeDominio::NoEncontrado.new)
  end

  def responder_datos_inaceptables(_error)
    responder_error_de_dominio(ErrorDeDominio::DatosInaceptables.new)
  end

  def responder_error_de_sentencia(error)
    return responder_datos_inaceptables(error) if ERRORES_DE_DATO_DEL_MOTOR.any? { |clase| error.cause.is_a?(clase) }

    responder_error_interno(error)
  end

  # 500 · Fallo no previsto, registrado en la bitácora sin exponer detalle interno
  def responder_error_interno(error)
    Rails.logger.error("#{error.class}: #{error.message}")
    Rails.logger.error("causa: #{error.cause.class}: #{error.cause.message}") if error.cause
    Rails.logger.error(error.backtrace&.first(20)&.join("\n"))
    responder(estado: 500, codigo: "error_interno",
              detalle: "No fue posible completar la operación.")
  end

  def responder(estado:, codigo:, detalle:, regla: nil)
    cuerpo = ManejadorDeErrores.cuerpo(estado: estado, codigo: codigo, detalle: detalle,
                                       instancia: request.path, regla: regla)

    render json: cuerpo, status: estado, content_type: TIPO_CONTENIDO
  end
end
