# Controlador base de la interfaz.
# RNF-21 · la totalidad de las reglas de negocio, el control de acceso y la lógica de
# notificación residen acá y nunca en el cliente.
class ApplicationController < ActionController::API
  include ManejadorDeErrores
  include Autenticacion
  include Autorizacion

  PAGINA_MAXIMA = 1_000_000

  before_action :rechazar_bytes_nulos

  private

  # Un byte nulo no es un dato: el motor lo rechaza y no hay valor que guardar.
  def rechazar_bytes_nulos
    raise ErrorDeDominio::DatosInaceptables if con_byte_nulo?(request.parameters)
  end

  def con_byte_nulo?(valor)
    case valor
    when String then valor.include?("\0")
    when Hash then valor.any? { |clave, dato| con_byte_nulo?(clave) || con_byte_nulo?(dato) }
    when Array then valor.any? { |dato| con_byte_nulo?(dato) }
    else false
    end
  end

  # Tabla 30 · colección paginada: la página pedida se acota a un entero que el motor admite.
  def pagina_pedida = params[:pagina].to_s.to_i.clamp(1, PAGINA_MAXIMA)

  def por_pagina_pedido
    por_pagina = params[:por_pagina].to_s.to_i
    por_pagina = 25 if por_pagina <= 0
    [ por_pagina, 100 ].min
  end
end
