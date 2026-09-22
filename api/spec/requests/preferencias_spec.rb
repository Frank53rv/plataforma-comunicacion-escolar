# RF-33 Configuración de preferencias · CU-13 · RN-18, RN-24
# Prueba: CP-RF-33
require "rails_helper"

RSpec.describe "Configuración de preferencias", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:usuario) { create(:usuario, :docente) }

  def consultar(por: usuario)
    get "/api/v1/usuarios/me/preferencias", headers: cabecera_de(por), as: :json
  end

  def configurar(por: usuario, **datos)
    put "/api/v1/usuarios/me/preferencias", params: datos, headers: cabecera_de(por), as: :json
  end

  # CP-RF-33 · RF-33 (Tabla 10): «Cada usuario debe poder configurar su horario de
  # disponibilidad y sus preferencias de recepción para los mensajes de conversación.»
  # Postcondición de CU-13 (Tabla 13): «El horario de disponibilidad y las preferencias
  # de recepción quedan registrados.»
  describe "CP-RF-33 · horario y preferencias nuevas" do
    it "quedan registradas y se devuelven en la consulta siguiente" do
      configurar(hora_inicio: "22:00", hora_fin: "07:00", recibir_mensajes: false)

      expect(response).to have_http_status(:ok)
      expect(cuerpo).to include("hora_inicio" => "22:00", "hora_fin" => "07:00", "recibir_mensajes" => false)
      expect(cuerpo["usuario_id"]).to eq(usuario.id)

      consultar
      expect(cuerpo).to include("hora_inicio" => "22:00", "hora_fin" => "07:00", "recibir_mensajes" => false)
    end

    it "admite reconfigurar sobre la misma fila (UNIQUE usuario_id)" do
      configurar(hora_inicio: "22:00", hora_fin: "07:00", recibir_mensajes: false)
      configurar(hora_inicio: "20:00", hora_fin: "06:00", recibir_mensajes: true)

      expect(Preferencia.where(usuario_id: usuario.id).count).to eq(1)
      expect(cuerpo).to include("hora_inicio" => "20:00", "hora_fin" => "06:00", "recibir_mensajes" => true)
    end
  end

  describe "sin preferencia configurada" do
    it "GET responde disponible las 24 horas y recibir_mensajes verdadero" do
      consultar

      expect(response).to have_http_status(:ok)
      expect(cuerpo).to include("usuario_id" => usuario.id, "hora_inicio" => "00:00",
                                "hora_fin" => "00:00", "recibir_mensajes" => true)
    end
  end

  describe "validación" do
    it "rechaza con 422 una hora mal formada" do
      configurar(hora_inicio: "25:00", hora_fin: "07:00", recibir_mensajes: true)
      expect(response).to have_http_status(:unprocessable_content)
    end

    it "rechaza con 422 si falta un campo obligatorio" do
      configurar(hora_inicio: "22:00", hora_fin: "07:00")
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "autorización" do
    %i[directivo docente tutor alumno].each do |rol|
      it "admite a #{rol} consultar y configurar sus propias preferencias" do
        persona = create(:usuario, rol)
        consultar(por: persona)
        expect(response).to have_http_status(:ok)
        configurar(por: persona, hora_inicio: "08:00", hora_fin: "20:00", recibir_mensajes: true)
        expect(response).to have_http_status(:ok)
      end
    end

    it "rechaza sin token con 401" do
      get "/api/v1/usuarios/me/preferencias", as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
