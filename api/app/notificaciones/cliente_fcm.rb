# RF-37 Degradación ante fallo de entrega · CU-14 · RNF-11, RNF-12
# Prueba: CP-RF-37
#
# Es el cliente de push que usan las notificaciones de anuncios y de mensajes, del
# módulo E.
# Tabla 23 · Firebase Cloud Messaging, nivel gratuito: «único componente externo».
# Tabla 30 · FCM_PROJECT_ID y FCM_CREDENCIAL_JSON (credencial de servicio).
# Habla con la API HTTP v1 de FCM: canjea una aserción RS256 firmada con la credencial de
# servicio por un token de acceso y envía con él. Sin dependencias fuera de las que el
# proyecto ya tiene (`jwt` y la biblioteca estándar).
#
# RNF-12 · la respuesta se clasifica en tres resultados:
#   :aceptado            el proveedor encoló el envío; no acredita entrega (Figura 7).
#   :credencial_invalida el proveedor rechazó el identificador de destino: no se reintenta
#                        y la suscripción pasa a inválida.
#   :transitorio         el servicio no está disponible, o el envío no pudo intentarse
#                        (incluida una credencial de servicio propia inutilizable, que no
#                        es de ninguna suscripción): se reintenta desde la cola.
class ClienteFcm
  Resultado = Struct.new(:estado, :codigo, keyword_init: true)

  URL_ENVIO = "https://fcm.googleapis.com/v1/projects/%<proyecto>s/messages:send".freeze
  ALCANCE = "https://www.googleapis.com/auth/firebase.messaging".freeze
  # Códigos de error de FCM que significan «este identificador de destino ya no sirve».
  DESTINO_RECHAZADO = %w[UNREGISTERED INVALID_ARGUMENT SENDER_ID_MISMATCH].freeze

  def self.desde_el_entorno
    new(proyecto: ENV["FCM_PROJECT_ID"], credencial_json: ENV["FCM_CREDENCIAL_JSON"])
  end

  # `transporte` es (metodo, url, cabeceras, cuerpo) → [estado_http, cuerpo]. Se inyecta
  # en las pruebas: ninguna hace una llamada real.
  def initialize(proyecto:, credencial_json:, transporte: nil)
    @proyecto = proyecto
    @credencial = interpretar(credencial_json)
    @transporte = transporte || method(:http)
    @acceso = nil
  end

  def enviar(token:, titulo:, cuerpo:)
    return Resultado.new(estado: :transitorio, codigo: "sin_credencial") unless credencial_completa?

    acceso = token_de_acceso
    return acceso if acceso.is_a?(Resultado)

    estado, respuesta = @transporte.call(
      :post, format(URL_ENVIO, proyecto: @proyecto),
      { "Authorization" => "Bearer #{acceso}", "Content-Type" => "application/json" },
      { message: { token: token, notification: { title: titulo, body: cuerpo } } }.to_json
    )
    clasificar(estado, respuesta)
  rescue StandardError => error
    Resultado.new(estado: :transitorio, codigo: error.class.name)
  end

  private

  def interpretar(json)
    JSON.parse(json.to_s)
  rescue JSON::ParserError
    {}
  end

  def credencial_completa?
    @proyecto.present? && @credencial["client_email"].present? && @credencial["private_key"].present?
  end

  # Token de acceso OAuth2, reutilizado hasta un minuto antes de su vencimiento.
  def token_de_acceso
    return @acceso[:token] if @acceso && @acceso[:vence] > 1.minute.from_now

    uri = @credencial["token_uri"].presence || "https://oauth2.googleapis.com/token"
    estado, respuesta = @transporte.call(
      :post, uri, { "Content-Type" => "application/x-www-form-urlencoded" },
      URI.encode_www_form(grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: asercion(uri))
    )
    return Resultado.new(estado: :transitorio, codigo: estado.to_s) unless estado == 200

    datos = JSON.parse(respuesta)
    @acceso = { token: datos.fetch("access_token"), vence: datos.fetch("expires_in", 3600).to_i.seconds.from_now }
    @acceso[:token]
  end

  def asercion(audiencia)
    ahora = Time.current.to_i
    JWT.encode({ iss: @credencial["client_email"], scope: ALCANCE, aud: audiencia, iat: ahora, exp: ahora + 3600 },
               OpenSSL::PKey::RSA.new(@credencial["private_key"]), "RS256")
  end

  def clasificar(estado, respuesta)
    return Resultado.new(estado: :aceptado, codigo: estado.to_s) if estado == 200

    codigo = codigo_de_error(respuesta)
    if DESTINO_RECHAZADO.include?(codigo)
      Resultado.new(estado: :credencial_invalida, codigo: codigo)
    else
      Resultado.new(estado: :transitorio, codigo: estado.to_s)
    end
  end

  def codigo_de_error(respuesta)
    error = JSON.parse(respuesta.to_s)["error"] || {}
    detalle = Array(error["details"]).filter_map { |d| d["errorCode"] }.first
    detalle || error["status"]
  rescue JSON::ParserError
    nil
  end

  def http(metodo, url, cabeceras, cuerpo)
    uri = URI(url)
    peticion = Net::HTTP.const_get(metodo.to_s.capitalize).new(uri, cabeceras)
    peticion.body = cuerpo
    respuesta = Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 5, read_timeout: 10) do |conexion|
      conexion.request(peticion)
    end
    [ respuesta.code.to_i, respuesta.body ]
  end
end
