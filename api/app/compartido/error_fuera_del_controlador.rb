# RNF-17 · Quality Spec, «Manejo de excepciones» · Boundary 6
# Prueba: CP-RNF-17
#
# Lo que falla antes de llegar a un controlador —una ruta fuera del inventario, una
# consulta mal codificada— responde con el mismo cuerpo del catálogo cerrado y sin detalle
# interno: la traza queda en la bitácora.
class ErrorFueraDelControlador
  ERRORES_DE_FORMA = [
    ActionController::BadRequest, ActionDispatch::Http::Parameters::ParseError,
    ActionDispatch::Http::MimeNegotiation::InvalidType, Rack::QueryParser::ParameterTypeError,
    Rack::QueryParser::InvalidParameterError
  ].freeze

  def self.call(entorno)
    error = entorno["action_dispatch.exception"]
    peticion = ActionDispatch::Request.new(entorno)
    respuesta = construir(error)

    cuerpo = ManejadorDeErrores.cuerpo(estado: respuesta.estado, codigo: respuesta.codigo,
                                       detalle: respuesta.detalle, instancia: peticion.path)
    [ respuesta.estado, { "content-type" => "#{ManejadorDeErrores::TIPO_CONTENIDO}; charset=utf-8" },
      [ cuerpo.to_json ] ]
  end

  def self.construir(error)
    case error
    when ActionController::RoutingError then ErrorDeDominio::NoEncontrado.new
    when *ERRORES_DE_FORMA then ErrorDeDominio::DatosInaceptables.new
    else
      Rails.logger.error("#{error.class}: #{error&.message}")
      ErrorDeDominio.new(estado: 500, codigo: "error_interno", detalle: "No fue posible completar la operación.")
    end
  end
  private_class_method :construir
end
