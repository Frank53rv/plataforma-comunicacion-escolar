# Tabla 39 · encabezado de autorización con el esquema de portador y el token de RF-01.
module CabeceraDeSesion
  def cabecera_de(usuario)
    { "Authorization" => "Bearer #{TokenDeSesion.emitir(usuario)[:token]}" }
  end
end

RSpec.configure do |config|
  config.include CabeceraDeSesion, type: :request
  config.include CabeceraDeSesion, type: :controller
end
