# RF-01 Autenticación de usuarios · CU-01 · RN-09, RN-11, RN-15
# Pruebas: CP-RF-01 · CP-RNF-02 · CP-RNF-03
#
# Tabla 27 · POST /api/v1/sesiones (sin autenticar) y DELETE /api/v1/sesiones
# (directivo, docente, tutor, alumno).
# Tabla 40 · petición: correo, contrasena. Respuesta: token, vence_en, usuario con id,
# nombre, apellido, rol y credencial_provisional.
require "rails_helper"

RSpec.describe "Sesiones", type: :request do
  def cuerpo = JSON.parse(response.body)

  describe "POST /api/v1/sesiones · CP-RF-01" do
    # «Correo y contraseña de una cuenta activa; luego la misma con contraseña errónea»
    let!(:usuario) do
      create(:usuario, :docente, correo: "docente@ejemplo.test", contrasena: "clave-correcta-123")
    end

    it "emite un token firmado con identidad, rol y vencimiento" do
      post "/api/v1/sesiones",
           params: { correo: "docente@ejemplo.test", contrasena: "clave-correcta-123" },
           as: :json

      expect(response).to have_http_status(:created)
      expect(cuerpo).to include("token", "vence_en", "usuario")
      expect(cuerpo["usuario"]).to include(
        "id" => usuario.id, "nombre" => usuario.nombre, "apellido" => usuario.apellido,
        "rol" => "docente", "credencial_provisional" => false
      )
      # RNF-03 · la respuesta no transporta la contraseña ni su derivación
      expect(cuerpo["usuario"]).not_to have_key("contrasena_hash")
      expect(response.body).not_to include("clave-correcta-123")

      # RF-01 · el token transporta la identidad y el rol
      carga = TokenDeSesion.verificar(cuerpo["token"])
      expect(carga["sub"]).to eq(usuario.id)
      expect(carga["rol"]).to eq("docente")
    end

    # CU-01 E1 · «un mensaje que no distingue cuál de los dos datos falló»
    it "rechaza la contraseña errónea con 401 sin distinguir cuál de los dos datos falló" do
      post "/api/v1/sesiones",
           params: { correo: "docente@ejemplo.test", contrasena: "clave-equivocada" },
           as: :json

      expect(response).to have_http_status(:unauthorized)
      detalle = cuerpo["detail"]

      post "/api/v1/sesiones",
           params: { correo: "inexistente@ejemplo.test", contrasena: "clave-correcta-123" },
           as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(cuerpo["detail"]).to eq(detalle)
      expect(cuerpo["detail"]).not_to match(/correo|contrase|usuario|exist/i)
    end

    # CU-01 E2 (Tabla 24, fila 401) · RN-11: la baja revoca el acceso y conserva el historial
    it "rechaza a la cuenta dada de baja y conserva su historial" do
      baja = create(:usuario, :tutor, :dado_de_baja,
                    correo: "baja@ejemplo.test", contrasena: "clave-correcta-123")

      post "/api/v1/sesiones",
           params: { correo: "baja@ejemplo.test", contrasena: "clave-correcta-123" },
           as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(Usuario.find(baja.id)).to be_present
      expect(Usuario.find(baja.id).estado).to eq("dado_de_baja")
    end

    # RF-43 · el token se emite; el bloqueo de las demás operaciones lo impone RF-43
    it "emite el token a quien tiene credencial provisional y lo declara en la respuesta" do
      create(:usuario, :directivo, :con_credencial_provisional,
             correo: "directivo@ejemplo.test", contrasena: "provisional-123")

      post "/api/v1/sesiones",
           params: { correo: "directivo@ejemplo.test", contrasena: "provisional-123" },
           as: :json

      expect(response).to have_http_status(:created)
      expect(cuerpo["usuario"]["credencial_provisional"]).to be(true)
    end

    it "rechaza a la cuenta que todavía no fue activada" do
      create(:usuario, :alumno, :pendiente, correo: "pendiente@ejemplo.test")

      post "/api/v1/sesiones",
           params: { correo: "pendiente@ejemplo.test", contrasena: "cualquiera" },
           as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    it "rechaza la petición sin los campos que la Tabla 40 declara" do
      post "/api/v1/sesiones", params: {}, as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "autenticidad y vencimiento del token · CP-RNF-02" do
    let(:usuario) { create(:usuario, :tutor) }

    it "acepta el token válido" do
      delete "/api/v1/sesiones", headers: cabecera_de(usuario)

      expect(response).to have_http_status(:no_content)
    end

    it "rechaza el token expirado con 401" do
      expirado = TokenDeSesion.emitir(usuario, vence_en: 1.hour.ago)[:token]

      delete "/api/v1/sesiones", headers: { "Authorization" => "Bearer #{expirado}" }

      expect(response).to have_http_status(:unauthorized)
    end

    it "rechaza el token alterado con 401" do
      valido = TokenDeSesion.emitir(usuario)[:token]
      cabecera, carga, firma = valido.split(".")
      alterado = [ cabecera, carga, firma.reverse ].join(".")

      delete "/api/v1/sesiones", headers: { "Authorization" => "Bearer #{alterado}" }

      expect(response).to have_http_status(:unauthorized)
    end

    it "rechaza la ausencia de token con 401" do
      delete "/api/v1/sesiones"

      expect(response).to have_http_status(:unauthorized)
    end

    # «El vencimiento no supera las 24 horas»
    it "emite un vencimiento no superior a veinticuatro horas" do
      emitido = TokenDeSesion.emitir(usuario)

      expect(emitido[:vence_en]).to be <= 24.hours.from_now
      expect(emitido[:vence_en]).to be > Time.current
    end

    it "no admite una vigencia configurada por encima del máximo de RNF-02" do
      allow(ENV).to receive(:fetch).and_call_original
      allow(ENV).to receive(:fetch).with("JWT_EXPIRACION_HORAS", anything).and_return("72")

      emitido = TokenDeSesion.emitir(usuario)

      expect(emitido[:vence_en]).to be <= 24.hours.from_now
    end
  end

  describe "resguardo no reversible de credenciales · CP-RNF-03" do
    it "no devuelve ninguna contraseña recuperable en la consulta a la tabla de usuarios" do
      create(:usuario, contrasena: "clave-de-prueba-123")

      fila = ActiveRecord::Base.connection.select_one("SELECT * FROM usuario LIMIT 1")

      expect(fila.values.map(&:to_s)).not_to include("clave-de-prueba-123")
      expect(fila["contrasena_hash"]).to start_with("$2a$")
      expect(fila.keys).not_to include("contrasena", "password")
    end

    it "deriva la contraseña con bcrypt y la verifica sin almacenarla" do
      usuario = create(:usuario, contrasena: "clave-de-prueba-123")

      expect(usuario.contrasena_hash).not_to include("clave-de-prueba-123")
      expect(usuario.contrasena_valida?("clave-de-prueba-123")).to be(true)
      expect(usuario.contrasena_valida?("otra-clave")).to be(false)
    end
  end

  # Tabla 26 · una prueba de autorización por cada uno de los cuatro roles
  describe "autorización de DELETE /api/v1/sesiones · insumo de CP-RNF-01" do
    %w[directivo docente tutor alumno].each do |rol|
      it "admite a #{rol}, que la Tabla 27 declara autorizado" do
        delete "/api/v1/sesiones", headers: cabecera_de(create(:usuario, rol: rol))

        expect(response).to have_http_status(:no_content)
      end
    end

    it "rechaza sin token con 401, conforme a la Tabla 35" do
      delete "/api/v1/sesiones"

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
