# RF-37 Degradación ante fallo de entrega · CU-14 · RN-18
# Prueba: CP-RF-37
require "rails_helper"

RSpec.describe "Suscripciones push", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:usuario) { create(:usuario, :tutor) }

  def registrar(token: "token-del-navegador-1", navegador: "Firefox", por: usuario)
    post "/api/v1/suscripciones-push", params: { token: token, navegador: navegador },
                                       headers: cabecera_de(por), as: :json
  end

  def invalidar(id, por: usuario)
    delete "/api/v1/suscripciones-push/#{id}", headers: cabecera_de(por), as: :json
  end

  # RF-37 (Tabla 10): «Ante indisponibilidad del servicio push, ausencia de acuse del
  # cliente o falta de soporte del navegador, el sistema debe entregar el aviso dentro de
  # la aplicación y registrar la causa…». Para poder enviar push, el destinatario
  # registra el identificador de destino de su navegador (Tabla 29).
  describe "POST /suscripciones-push · registrar el identificador de destino" do
    it "crea la suscripción vigente de quien la presenta y responde el recurso, sin el token" do
      registrar

      expect(response).to have_http_status(:created)
      expect(cuerpo).to include("usuario_id" => usuario.id, "navegador" => "Firefox", "estado" => "vigente")
      expect(cuerpo).to include("id", "creada_en")
      expect(cuerpo["invalidada_en"]).to be_nil
      expect(cuerpo).not_to have_key("token")
      expect(SuscripcionPush.find(cuerpo["id"]).token).to eq("token-del-navegador-1")
    end

    it "responde la misma suscripción si el mismo usuario reenvía el mismo token" do
      registrar
      primera = cuerpo["id"]

      registrar

      expect(response).to have_http_status(:created)
      expect(cuerpo["id"]).to eq(primera)
      expect(SuscripcionPush.where(token: "token-del-navegador-1").count).to eq(1)
    end

    it "reasigna el token a quien lo presenta si otra persona lo tenía (mismo navegador)" do
      otra = create(:usuario, :alumno)
      registrar(por: otra)

      registrar

      expect(SuscripcionPush.find_by!(token: "token-del-navegador-1")).to have_attributes(
        usuario_id: usuario.id, estado: "vigente"
      )
    end

    it "reactiva una suscripción inválida cuando el navegador vuelve a registrarse" do
      registrar
      invalidar(cuerpo["id"])

      registrar

      expect(cuerpo["estado"]).to eq("vigente")
      expect(cuerpo["invalidada_en"]).to be_nil
    end

    it "rechaza con 422 si falta el token o el navegador" do
      post "/api/v1/suscripciones-push", params: { navegador: "Firefox" }, headers: cabecera_de(usuario), as: :json
      expect(response).to have_http_status(:unprocessable_content)
      post "/api/v1/suscripciones-push", params: { token: "x" }, headers: cabecera_de(usuario), as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end

    it "rechaza con 422 un navegador que excede los 80 caracteres" do
      registrar(navegador: "N" * 81)
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "DELETE /suscripciones-push/{id} · invalidar el identificador" do
    it "deja la suscripción inválida, con su marca, y responde el recurso" do
      registrar
      id = cuerpo["id"]

      freeze_time do
        invalidar(id)

        expect(response).to have_http_status(:ok)
        expect(cuerpo).to include("id" => id, "estado" => "invalida")
        expect(Time.zone.parse(cuerpo["invalidada_en"])).to eq(Time.current)
      end
    end

    it "es idempotente: invalidar dos veces no altera la marca original" do
      registrar
      id = cuerpo["id"]
      invalidar(id)
      original = cuerpo["invalidada_en"]

      travel_to(1.hour.from_now) { invalidar(id) }

      expect(response).to have_http_status(:ok)
      expect(cuerpo["invalidada_en"]).to eq(original)
    end

    it "responde 404 si la suscripción es de otra persona o no existe" do
      registrar
      id = cuerpo["id"]

      invalidar(id, por: create(:usuario, :alumno))
      expect(response).to have_http_status(:not_found)
      invalidar(SecureRandom.uuid)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "autorización" do
    %i[directivo docente tutor alumno].each do |rol|
      it "admite a #{rol}" do
        registrar(token: "token-#{rol}", por: create(:usuario, rol))
        expect(response).to have_http_status(:created)
      end
    end

    it "rechaza sin token con 401" do
      post "/api/v1/suscripciones-push", params: { token: "x", navegador: "y" }, as: :json
      expect(response).to have_http_status(:unauthorized)
      delete "/api/v1/suscripciones-push/#{SecureRandom.uuid}", as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
