# RF-45 Consulta directiva del estado de la comunicación · CU-15 · RN-22
# Prueba: CP-RF-45
require "rails_helper"

RSpec.describe "Supervisión directiva del estado de la comunicación", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:directivo) { create(:usuario, :directivo) }
  let(:docente) { create(:usuario, :docente) }
  let(:curso_a) { create(:curso) }
  let(:curso_b) { create(:curso) }

  before do
    create(:docente_curso, docente: docente, curso: curso_a)
    create(:docente_curso, docente: docente, curso: curso_b)
  end

  def publicar(cursos:)
    post "/api/v1/anuncios", params: { titulo: "Aviso", cuerpo: "Contenido.", cursos: cursos },
         headers: cabecera_de(docente), as: :json
  end

  def supervisar(por: directivo, **filtros)
    ruta = "/api/v1/supervision/cursos"
    ruta += "?#{filtros.to_query}" if filtros.any?
    get ruta, headers: cabecera_de(por), as: :json
  end

  # CP-RF-45 · «Consulta directiva del estado agregado. Sesión de directivo sobre el
  # año lectivo vigente. Anuncios de la totalidad de los cursos y estado agregado de
  # entrega y lectura por curso.»
  describe "CP-RF-45 · estado agregado por curso" do
    it "agrega, por curso, la cantidad de anuncios y el estado de entrega y lectura" do
      alumno_a = create(:usuario, :alumno)
      create(:alumno_curso, alumno: alumno_a, curso: curso_a)
      publicar(cursos: [ curso_a.id ])
      entrega = EntregaAnuncio.find_by(destinatario_id: alumno_a.id)
      entrega.update!(leida_en: Time.current)

      alumno_b = create(:usuario, :alumno)
      create(:alumno_curso, alumno: alumno_b, curso: curso_b)
      publicar(cursos: [ curso_b.id ])

      supervisar

      expect(response).to have_http_status(:ok)
      expect(cuerpo).to include("pagina" => 1, "por_pagina" => 25)
      fila_a = cuerpo["datos"].find { |f| f["curso"]["id"] == curso_a.id }
      fila_b = cuerpo["datos"].find { |f| f["curso"]["id"] == curso_b.id }
      expect(fila_a).to include(
        "anuncios" => 1, "enviadas" => 1, "entregadas" => 0, "vistas" => 0, "leidas" => 1
      )
      expect(fila_b).to include(
        "anuncios" => 1, "enviadas" => 1, "entregadas" => 0, "vistas" => 0, "leidas" => 0
      )
    end

    it "un anuncio dirigido a varios cursos aporta a cada curso el recuento de su propia comunidad" do
      alumno_a = create(:usuario, :alumno)
      create(:alumno_curso, alumno: alumno_a, curso: curso_a)
      alumno_b = create(:usuario, :alumno)
      create(:alumno_curso, alumno: alumno_b, curso: curso_b)

      publicar(cursos: [ curso_a.id, curso_b.id ])

      supervisar

      fila_a = cuerpo["datos"].find { |f| f["curso"]["id"] == curso_a.id }
      fila_b = cuerpo["datos"].find { |f| f["curso"]["id"] == curso_b.id }
      expect(fila_a).to include("anuncios" => 1, "enviadas" => 1)
      expect(fila_b).to include("anuncios" => 1, "enviadas" => 1)
    end
  end

  describe "año lectivo de la consulta" do
    it "por omisión usa el año lectivo vigente" do
      supervisar

      expect(cuerpo["datos"].map { |f| f["curso"]["id"] }).to include(curso_a.id, curso_b.id)
      expect(cuerpo["total"]).to eq(cuerpo["datos"].size)
    end

    it "admite consultar un año lectivo distinto, ya cerrado" do
      otro_anio = create(:anio_lectivo, anio: curso_a.anio_lectivo.anio + 1, estado: "cerrado")
      curso_de_otro_anio = create(:curso, anio_lectivo: otro_anio)

      supervisar(anio_lectivo_id: otro_anio.id)

      expect(cuerpo["datos"].map { |f| f["curso"]["id"] }).to contain_exactly(curso_de_otro_anio.id)
    end
  end

  describe "autorización" do
    it "admite al directivo" do
      supervisar
      expect(response).to have_http_status(:ok)
    end

    %w[docente tutor alumno].each do |rol|
      it "rechaza a #{rol} con 403" do
        supervisar(por: create(:usuario, rol: rol))
        expect(response).to have_http_status(:forbidden)
      end
    end

    it "rechaza sin token con 401" do
      get "/api/v1/supervision/cursos", as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
