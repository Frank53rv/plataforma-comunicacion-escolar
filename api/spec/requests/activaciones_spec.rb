# RF-06 Activación de cuenta · CU-02 · RN-05, RN-06
# Prueba: CP-RF-06
#
# Tabla 27 · POST /api/v1/activaciones · sin autenticar.
# Tabla 40 · petición: codigo, contrasena. Respuesta: token, vence_en, usuario.
require "rails_helper"

RSpec.describe "Activación de cuenta", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:docente) { create(:usuario, :docente) }
  let!(:alta) do
    RegistroDePersona.registrar(
      nombre: "Tutor", apellido: "Ficticio", correo: "tutor@ejemplo.test",
      rol: "tutor", registrado_por: docente
    )
  end

  def activar(codigo, contrasena = "clave-propia-123")
    post "/api/v1/activaciones", params: { codigo: codigo, contrasena: contrasena }, as: :json
  end

  # CP-RF-06 · «Código vigente y contraseña propia; luego el mismo código →
  # Cuenta activa y código invalidado. El segundo canje responde 410.»
  describe "CP-RF-06" do
    it "activa la cuenta con contraseña propia e invalida el código" do
      activar(alta.codigo_en_claro)

      expect(response).to have_http_status(:created)
      usuario = alta.usuario.reload
      expect(usuario.estado).to eq("activo")
      expect(usuario.contrasena_valida?("clave-propia-123")).to be(true)
      expect(alta.codigo_activacion.reload.usado_en).to be_present
    end

    it "responde 410 al segundo canje del mismo código" do
      activar(alta.codigo_en_claro)
      activar(alta.codigo_en_claro, "otra-clave-456")

      expect(response).to have_http_status(:gone)
      expect(alta.usuario.reload.contrasena_valida?("clave-propia-123")).to be(true)
    end
  end

  # Tabla 40 · «token, vence_en, usuario»
  it "devuelve una sesión con la forma de la Tabla 40" do
    activar(alta.codigo_en_claro)

    expect(cuerpo).to include("token", "vence_en", "usuario")
    expect(cuerpo["usuario"]).to include("id" => alta.usuario.id, "rol" => "tutor",
                                         "credencial_provisional" => false)
    expect(TokenDeSesion.verificar(cuerpo["token"])["sub"]).to eq(alta.usuario.id)
    expect(response.body).not_to include("clave-propia-123")
  end

  it "habilita la autenticación con la contraseña recién definida (CU-01)" do
    activar(alta.codigo_en_claro)

    post "/api/v1/sesiones",
         params: { correo: "tutor@ejemplo.test", contrasena: "clave-propia-123" }, as: :json

    expect(response).to have_http_status(:created)
  end

  # CU-02 E1 · «si el código venció, ya fue utilizado o no existe, la activación se
  # rechaza». Los tres supuestos responden igual: el rechazo no revela cuál fue.
  describe "CU-02 E1 · 410" do
    it "rechaza el código vencido" do
      travel_to(Time.current + 7.days + 1.minute) { activar(alta.codigo_en_claro) }

      expect(response).to have_http_status(:gone)
      expect(alta.usuario.reload.estado).to eq("pendiente")
    end

    it "rechaza el código inexistente" do
      activar("3F9A1C2E-K7PX9M4Q")

      expect(response).to have_http_status(:gone)
    end

    it "rechaza la forma inválida como código inexistente" do
      activar("no-es-un-codigo")

      expect(response).to have_http_status(:gone)
    end

    it "responde con el mismo cuerpo en los tres supuestos" do
      activar("3F9A1C2E-K7PX9M4Q")
      inexistente = cuerpo.except("instance")

      activar(alta.codigo_en_claro)
      activar(alta.codigo_en_claro)
      usado = cuerpo.except("instance")

      expect(usado).to eq(inexistente)
      expect(usado["codigo"]).to eq("codigo_no_vigente")
    end
  end

  # RN-11 · la baja revoca el acceso: el canje no puede restituirlo. La Tabla 35 pone
  # «cuenta dada de baja» en la fila del 401.
  it "no restituye el acceso a una cuenta dada de baja" do
    alta.usuario.update!(estado: "dado_de_baja")

    activar(alta.codigo_en_claro)

    expect(response).to have_http_status(:unauthorized)
    expect(alta.usuario.reload.estado).to eq("dado_de_baja")
    expect(alta.codigo_activacion.reload.usado_en).to be_nil
  end

  # D-12 · restablecer la contraseña de una cuenta activa es un requisito Should have
  it "no restablece la contraseña de una cuenta ya activa: 410, igual que un código no vigente" do
    alta.usuario.update!(estado: "activo", contrasena: "clave-original-123")

    activar(alta.codigo_en_claro, "clave-sustituta-456")

    expect(response).to have_http_status(:gone)
    expect(cuerpo["codigo"]).to eq("codigo_no_vigente")
    expect(alta.usuario.reload.contrasena_valida?("clave-original-123")).to be(true)
    expect(alta.codigo_activacion.reload.usado_en).to be_nil
  end

  it "rechaza con 422 la petición sin los campos de la Tabla 40" do
    post "/api/v1/activaciones", params: { codigo: alta.codigo_en_claro }, as: :json

    expect(response).to have_http_status(:unprocessable_content)
    expect(alta.codigo_activacion.reload.usado_en).to be_nil
  end

  it "acepta el código transcrito a mano (D-11)" do
    activar(alta.codigo_en_claro.downcase.delete("-"))

    expect(response).to have_http_status(:created)
  end

  # CU-02 postcondición · «la cuenta queda activa con contraseña propia»
  it "deja la credencial como propia y no provisional" do
    alta.usuario.update!(credencial_provisional: true)

    activar(alta.codigo_en_claro)

    expect(alta.usuario.reload.credencial_provisional).to be(false)
  end
end
