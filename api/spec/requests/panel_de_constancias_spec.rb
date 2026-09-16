# RF-23 Panel de constancias del docente · CU-11 · RN-21
# Prueba: CP-RF-23
require "rails_helper"

RSpec.describe "Panel de constancias del docente", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:docente) { create(:usuario, :docente) }
  let(:curso) { create(:curso) }

  before { create(:docente_curso, docente: docente, curso: curso) }

  def publicar(cursos:, por: docente)
    post "/api/v1/anuncios", params: { titulo: "Aviso", cuerpo: "Contenido.", cursos: cursos },
         headers: cabecera_de(por), as: :json
  end

  def constancias(anuncio_id, por: docente, **filtros)
    ruta = "/api/v1/anuncios/#{anuncio_id}/constancias"
    ruta += "?#{filtros.to_query}" if filtros.any?
    get ruta, headers: cabecera_de(por), as: :json
  end

  # CP-RF-23 · «Constancias del anuncio propio y del ajeno. Anuncio con destinatarios
  # que leyeron y que no leyeron. Recuento sobre el total y nómina de quienes no
  # leyeron; el ajeno responde 403.»
  describe "CP-RF-23 · constancias" do
    it "recuenta las lecturas sobre el total y lista a quienes no leyeron" do
      leyo = create(:usuario, :alumno, nombre: "Ana", apellido: "Aguilar")
      no_leyo = create(:usuario, :alumno, nombre: "Beto", apellido: "Bravo")
      create(:alumno_curso, alumno: leyo, curso: curso)
      create(:alumno_curso, alumno: no_leyo, curso: curso)

      publicar(cursos: [ curso.id ])
      anuncio_id = cuerpo["id"]
      EntregaAnuncio.find_by(destinatario_id: leyo.id).update!(leida_en: Time.current)

      constancias(anuncio_id)

      expect(response).to have_http_status(:ok)
      expect(cuerpo["total_destinatarios"]).to eq(2)
      expect(cuerpo["con_lectura_registrada"]).to eq(1)
      expect(cuerpo["no_leyeron"]["datos"].pluck("id")).to contain_exactly(no_leyo.id)
      expect(cuerpo["no_leyeron"]).to include("total" => 1, "pagina" => 1, "por_pagina" => 25)
    end

    it "rechaza con 403 la consulta de un anuncio del que no es autor (CU-11 E1)" do
      publicar(cursos: [ curso.id ])
      anuncio_id = cuerpo["id"]
      otro_docente = create(:usuario, :docente)

      constancias(anuncio_id, por: otro_docente)

      expect(response).to have_http_status(:forbidden)
    end

    it "responde 404 si el anuncio no existe" do
      constancias(SecureRandom.uuid)
      expect(response).to have_http_status(:not_found)
    end
  end

  # D-05 · RF-38 (familia alcanzada) es Should have: no se construye en esta entrega.
  describe "alcance · Boundary 1 · RF-38 no se construye" do
    it "no incluye el indicador de familia alcanzada en la respuesta" do
      alumno = create(:usuario, :alumno)
      create(:alumno_curso, alumno: alumno, curso: curso)
      publicar(cursos: [ curso.id ])

      constancias(cuerpo["id"])

      expect(cuerpo).not_to have_key("familia_alcanzada")
      expect(cuerpo["no_leyeron"]["datos"].first).not_to have_key("familia_alcanzada")
    end
  end

  describe "paginación de la nómina de quienes no leyeron" do
    it "pagina la nómina con pagina y por_pagina" do
      3.times do |n|
        alumno = create(:usuario, :alumno, nombre: "Alumno#{n}")
        create(:alumno_curso, alumno: alumno, curso: curso)
      end
      publicar(cursos: [ curso.id ])

      constancias(cuerpo["id"], por_pagina: 2, pagina: 2)

      expect(cuerpo["no_leyeron"]["datos"].size).to eq(1)
      expect(cuerpo["no_leyeron"]).to include("total" => 3, "pagina" => 2, "por_pagina" => 2)
    end
  end

  describe "autorización" do
    it "admite al docente autor" do
      publicar(cursos: [ curso.id ])
      constancias(cuerpo["id"])
      expect(response).to have_http_status(:ok)
    end

    %w[directivo tutor alumno].each do |rol|
      it "rechaza a #{rol} con 403" do
        publicar(cursos: [ curso.id ])
        constancias(cuerpo["id"], por: create(:usuario, rol: rol))
        expect(response).to have_http_status(:forbidden)
      end
    end

    it "rechaza sin token con 401" do
      publicar(cursos: [ curso.id ])
      get "/api/v1/anuncios/#{cuerpo['id']}/constancias", as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
