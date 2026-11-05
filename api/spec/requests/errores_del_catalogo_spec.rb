# RNF-17 · Quality Spec, «Manejo de excepciones» · Boundary 6
# Prueba: CP-RNF-17
#
# El catálogo de errores es cerrado y ningún cuerpo de error revela detalle interno: una
# entrada inválida es un dato inaceptable (422) y no un fallo no previsto (500); lo que no
# llega a un controlador —una ruta inexistente, una consulta mal codificada— responde con el
# mismo formato.
require "rails_helper"

RSpec.describe "Respuestas de error dentro del catálogo", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:directivo) { create(:usuario, :directivo) }

  def es_problema(estado)
    expect(response).to have_http_status(estado)
    expect(response.media_type).to eq("application/problem+json")
    expect(cuerpo).to include("status" => estado, "codigo" => be_present)
    expect(cuerpo.keys).not_to include("exception", "traces", "error")
  end

  describe "CP-RNF-17 · datos inaceptables" do
    it "un estado de curso desconocido es 422" do
      get "/api/v1/cursos", params: { estado: "foo" }, headers: cabecera_de(directivo)
      es_problema(422)
    end

    it "una página fuera de rango se acota y responde 200" do
      get "/api/v1/cursos", params: { pagina: "99999999999999999999" }, headers: cabecera_de(directivo)
      expect(response).to have_http_status(:ok)
      expect(cuerpo["pagina"]).to be <= 1_000_000
    end

    it "un JSON mal formado es 422" do
      post "/api/v1/sesiones", params: '{"correo":', headers: { "CONTENT_TYPE" => "application/json" }
      es_problema(422)
    end

    it "un byte nulo en un dato es 422" do
      post "/api/v1/sesiones", params: { correo: "a\u0000b@ejemplo.test", contrasena: "x" }, as: :json
      es_problema(422)
    end

    it "una consulta con codificación inválida es 422" do
      get "/api/v1/cursos?x=%FF", headers: cabecera_de(directivo)
      es_problema(422)
    end
  end

  describe "CP-RNF-17 · rutas fuera del inventario" do
    it "una ruta inexistente es 404 con el formato del catálogo y sin trazas" do
      get "/api/v1/no-existe", headers: cabecera_de(directivo)
      es_problema(404)
    end
  end
end
