# RF-11 Creación del año lectivo · CU-03 · RN-02, RN-31
# Prueba: CP-RF-11
#
# Tabla 18 · POST /api/v1/anios-lectivos y GET /api/v1/anios-lectivos · directivo.
# Tabla 29 · petición: anio → recurso anio_lectivo. GET: sin parámetros → colección.
require "rails_helper"

RSpec.describe "Creación del año lectivo", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:directivo) { create(:usuario, :directivo) }

  def crear_anio(anio: 2026, por: directivo)
    post "/api/v1/anios-lectivos", params: { anio: anio }, headers: cabecera_de(por), as: :json
  end

  def listar_anios(por: directivo)
    get "/api/v1/anios-lectivos", headers: cabecera_de(por), as: :json
  end

  # CP-RF-11 · RF-11 (Tabla 10): «El directivo debe poder crear un año lectivo, que
  # actúa como contenedor de los cursos y delimita el archivado.» Un segundo año
  # lectivo con el anterior vigente se rechaza con 409 y RN-31 (Tabla 24, fila 409).
  describe "CP-RF-11 · creación y unicidad del año vigente" do
    it "crea el año lectivo en estado vigente, conforme a RF-11" do
      crear_anio(anio: 2026)

      expect(response).to have_http_status(:created)
      expect(cuerpo).to include("anio" => 2026, "estado" => "vigente")
      expect(cuerpo["cerrado_en"]).to be_nil
    end

    it "rechaza con 409 y RN-31 la creación de un segundo año lectivo vigente" do
      crear_anio(anio: 2026)
      expect(response).to have_http_status(:created)

      crear_anio(anio: 2027)

      expect(response).to have_http_status(:conflict)
      expect(cuerpo["regla"]).to eq("RN-31")
      expect(AnioLectivo.count).to eq(1)
    end
  end

  describe "validaciones de forma · 422" do
    it "rechaza la petición sin el campo anio" do
      crear_anio(anio: nil)

      expect(response).to have_http_status(:unprocessable_content)
      expect(AnioLectivo.count).to eq(0)
    end

    # Tabla 27 · «UNIQUE (anio)»: no se reutiliza el mismo año calendario, ni siquiera
    # cerrado. La violación del índice se traduce al 422 general, como toda
    # unicidad sin flujo de excepción propio.
    it "rechaza un año calendario ya utilizado, aunque el vigente esté cerrado" do
      create(:anio_lectivo, anio: 2025, estado: "cerrado")

      crear_anio(anio: 2025)

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "GET /api/v1/anios-lectivos" do
    it "responde la colección con la forma de la Tabla 28" do
      create(:anio_lectivo, anio: 2024, estado: "cerrado")
      create(:anio_lectivo, anio: 2025, estado: "vigente")

      listar_anios

      expect(response).to have_http_status(:ok)
      expect(cuerpo["datos"].pluck("anio")).to contain_exactly(2024, 2025)
      expect(cuerpo).to include("total" => 2, "pagina" => 1, "por_pagina" => 25)
    end
  end

  # RN-02 · «El directivo crea el año lectivo…»
  describe "autorización" do
    it "admite al directivo a crear" do
      crear_anio

      expect(response).to have_http_status(:created)
    end

    it "admite al directivo a listar" do
      listar_anios

      expect(response).to have_http_status(:ok)
    end

    %w[docente tutor alumno].each do |rol|
      it "rechaza a #{rol} con 403 al crear, sin efectos" do
        crear_anio(por: create(:usuario, rol: rol))

        expect(response).to have_http_status(:forbidden)
        expect(AnioLectivo.count).to eq(0)
      end

      it "rechaza a #{rol} con 403 al listar" do
        listar_anios(por: create(:usuario, rol: rol))

        expect(response).to have_http_status(:forbidden)
      end
    end

    it "rechaza sin token con 401 al crear" do
      post "/api/v1/anios-lectivos", params: { anio: 2026 }, as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    it "rechaza sin token con 401 al listar" do
      get "/api/v1/anios-lectivos", as: :json

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
