# RF-37 Degradación ante fallo de entrega · CU-14 · RNF-11, RNF-12
# Prueba: CP-RF-37
require "rails_helper"

RSpec.describe ClienteFcm do
  let(:clave) { OpenSSL::PKey::RSA.new(2048) }
  let(:credencial) do
    { "client_email" => "servicio@proyecto.iam.gserviceaccount.com", "private_key" => clave.to_pem,
      "token_uri" => "https://oauth2.googleapis.com/token" }.to_json
  end
  let(:llamadas) { [] }

  # El transporte recibe (metodo, url, cabeceras, cuerpo) y devuelve [estado, cuerpo_json].
  def cliente_con(respuestas, credencial_json: credencial)
    transporte = lambda do |metodo, url, cabeceras, cuerpo|
      llamadas << { metodo: metodo, url: url, cabeceras: cabeceras, cuerpo: cuerpo }
      respuestas.shift or raise "sin respuesta preparada para #{url}"
    end
    described_class.new(proyecto: "proyecto-de-prueba", credencial_json: credencial_json, transporte: transporte)
  end

  def token_oauth = [ 200, { "access_token" => "acceso-1", "expires_in" => 3600 }.to_json ]

  def enviar(respuestas, **opciones)
    cliente_con(respuestas, **opciones).enviar(token: "token-destino", titulo: "Título", cuerpo: "Cuerpo")
  end

  describe "envío aceptado" do
    it "firma la aserción con la credencial de servicio, canjea el token y envía a la API v1 del proyecto" do
      resultado = enviar([ token_oauth, [ 200, { "name" => "projects/p/messages/1" }.to_json ] ])

      expect(resultado).to have_attributes(estado: :aceptado, codigo: "200")
      canje, envio = llamadas
      expect(canje[:url]).to eq("https://oauth2.googleapis.com/token")
      expect(canje[:cuerpo]).to include("grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer")
      asercion = Rack::Utils.parse_query(canje[:cuerpo])["assertion"]
      carga, = JWT.decode(asercion, clave.public_key, true, algorithm: "RS256")
      expect(carga).to include("iss" => "servicio@proyecto.iam.gserviceaccount.com",
                               "scope" => "https://www.googleapis.com/auth/firebase.messaging")
      expect(envio[:url]).to eq("https://fcm.googleapis.com/v1/projects/proyecto-de-prueba/messages:send")
      expect(envio[:cabeceras]["Authorization"]).to eq("Bearer acceso-1")
      expect(JSON.parse(envio[:cuerpo])).to eq(
        "message" => { "token" => "token-destino", "notification" => { "title" => "Título", "body" => "Cuerpo" } }
      )
    end

    it "reutiliza el token de acceso mientras no venza" do
      cliente = cliente_con([ token_oauth, [ 200, "{}" ], [ 200, "{}" ] ])

      2.times { cliente.enviar(token: "t", titulo: "a", cuerpo: "b") }

      expect(llamadas.count { |llamada| llamada[:url].include?("oauth2") }).to eq(1)
    end
  end

  describe "clasificación de los fallos (RNF-12)" do
    it "el destino no registrado es credencial inválida: no se reintenta" do
      cuerpo = { "error" => { "status" => "NOT_FOUND", "details" => [ { "errorCode" => "UNREGISTERED" } ] } }.to_json

      expect(enviar([ token_oauth, [ 404, cuerpo ] ])).to have_attributes(estado: :credencial_invalida, codigo: "UNREGISTERED")
    end

    it "un identificador de destino inválido es credencial inválida" do
      cuerpo = { "error" => { "status" => "INVALID_ARGUMENT" } }.to_json

      expect(enviar([ token_oauth, [ 400, cuerpo ] ])).to have_attributes(estado: :credencial_invalida, codigo: "INVALID_ARGUMENT")
    end

    it "el emisor que no corresponde al destino es credencial inválida" do
      cuerpo = { "error" => { "status" => "PERMISSION_DENIED", "details" => [ { "errorCode" => "SENDER_ID_MISMATCH" } ] } }.to_json

      expect(enviar([ token_oauth, [ 403, cuerpo ] ])).to have_attributes(estado: :credencial_invalida, codigo: "SENDER_ID_MISMATCH")
    end

    [ 429, 500, 503 ].each do |estado|
      it "el #{estado} del proveedor es transitorio: se reintenta" do
        expect(enviar([ token_oauth, [ estado, "{}" ] ])).to have_attributes(estado: :transitorio, codigo: estado.to_s)
      end
    end

    it "el rechazo del canje del token de acceso es transitorio, y no invalida a nadie" do
      expect(enviar([ [ 401, "{}" ] ])).to have_attributes(estado: :transitorio, codigo: "401")
    end

    it "un error de red es transitorio" do
      transporte = ->(*) { raise Errno::ECONNREFUSED }
      cliente = described_class.new(proyecto: "p", credencial_json: credencial, transporte: transporte)

      expect(cliente.enviar(token: "t", titulo: "a", cuerpo: "b")).to have_attributes(estado: :transitorio, codigo: "Errno::ECONNREFUSED")
    end

    it "sin credencial configurada es transitorio: el servicio no está disponible" do
      expect(enviar([], credencial_json: "{}")).to have_attributes(estado: :transitorio, codigo: "sin_credencial")
      expect(enviar([], credencial_json: nil)).to have_attributes(estado: :transitorio, codigo: "sin_credencial")
    end
  end
end
