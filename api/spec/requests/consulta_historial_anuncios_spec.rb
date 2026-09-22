# RF-22 Consulta del historial de anuncios · CU-09 · RN-15, RN-22, RN-27, RN-28
# Prueba: CP-RF-22
require "rails_helper"

RSpec.describe "Consulta del historial de anuncios", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:docente) { create(:usuario, :docente) }
  let(:curso) { create(:curso) }

  before { create(:docente_curso, docente: docente, curso: curso) }

  def publicar(cursos:, titulo: "Aviso", por: docente)
    post "/api/v1/anuncios", params: { titulo: titulo, cuerpo: "Contenido.", cursos: cursos },
         headers: cabecera_de(por), as: :json
  end

  def listar(por:, **filtros)
    ruta = filtros.any? ? "/api/v1/anuncios?#{filtros.to_query}" : "/api/v1/anuncios"
    get ruta, headers: cabecera_de(por), as: :json
  end

  def ver(id, por:)
    get "/api/v1/anuncios/#{id}", headers: cabecera_de(por), as: :json
  end

  # CP-RF-22 · RF-22 (Tabla 10): «Todo usuario debe poder recuperar los anuncios que
  # le corresponden, filtrando por fecha, curso y remitente.» El ajeno a sus
  # vinculaciones responde 404 (Tabla 24, fila 404, CU-09 E1).
  describe "CP-RF-22 · historial filtrado y ajeno" do
    it "filtra por curso, remitente y rango de fechas combinados" do
      otro_docente = create(:usuario, :docente)
      create(:docente_curso, docente: otro_docente, curso: curso)
      publicar(cursos: [ curso.id ], titulo: "De docente A")
      publicar(cursos: [ curso.id ], titulo: "De docente B", por: otro_docente)
      otro_curso = create(:curso)
      create(:docente_curso, docente: docente, curso: otro_curso)
      publicar(cursos: [ otro_curso.id ], titulo: "Otro curso")

      listar(por: docente, curso_id: curso.id, remitente_id: docente.id,
             desde: 1.hour.ago.iso8601, hasta: 1.hour.from_now.iso8601)

      expect(response).to have_http_status(:ok)
      expect(cuerpo["datos"].pluck("titulo")).to contain_exactly("De docente A")
    end

    it "responde 404 sobre un anuncio ajeno a las vinculaciones de quien consulta (CU-09 E1)" do
      publicar(cursos: [ curso.id ])
      anuncio_id = cuerpo["id"]
      docente_ajeno = create(:usuario, :docente)

      ver(anuncio_id, por: docente_ajeno)

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "alcance por rol · RN-22" do
    it "el docente ve los anuncios de los cursos que dicta, aunque los publique otro docente" do
      otro_docente = create(:usuario, :docente)
      create(:docente_curso, docente: otro_docente, curso: curso)
      publicar(cursos: [ curso.id ], por: otro_docente)

      listar(por: docente)

      expect(cuerpo["datos"].size).to eq(1)
    end

    it "el alumno y el tutor ven sólo los anuncios donde tienen una fila de entrega" do
      alumno = create(:usuario, :alumno)
      create(:alumno_curso, alumno: alumno, curso: curso)
      tutor = create(:usuario, :tutor)
      create(:tutor_alumno, tutor: tutor, alumno: alumno)
      publicar(cursos: [ curso.id ])

      listar(por: alumno)
      expect(cuerpo["datos"].size).to eq(1)

      listar(por: tutor)
      expect(cuerpo["datos"].size).to eq(1)
    end

    it "el alumno no ve el anuncio publicado antes de vincularse al curso (RF-21)" do
      publicar(cursos: [ curso.id ])
      alumno_posterior = create(:usuario, :alumno)
      create(:alumno_curso, alumno: alumno_posterior, curso: curso)

      listar(por: alumno_posterior)

      expect(cuerpo["datos"]).to be_empty
    end

    it "el directivo ve los anuncios de todos los cursos del año lectivo vigente" do
      directivo = create(:usuario, :directivo)
      publicar(cursos: [ curso.id ])

      listar(por: directivo)

      expect(cuerpo["datos"].size).to eq(1)
    end
  end

  describe "forma de la respuesta" do
    it "el índice trae titulo, publicado_en, autor (recurso completo) y leido de quien consulta" do
      alumno = create(:usuario, :alumno)
      create(:alumno_curso, alumno: alumno, curso: curso)
      publicar(cursos: [ curso.id ], titulo: "Reunión")
      entrega = EntregaAnuncio.find_by(destinatario_id: alumno.id)
      entrega.update!(leida_en: Time.current)

      listar(por: alumno)

      fila = cuerpo["datos"].first
      expect(fila).to include("titulo" => "Reunión", "leido" => true)
      expect(fila["autor"]).to include("id" => docente.id)
      expect(fila["publicado_en"]).to be_present
    end

    it "el directivo, que no es destinatario, recibe leido en falso" do
      directivo = create(:usuario, :directivo)
      publicar(cursos: [ curso.id ])

      listar(por: directivo)

      expect(cuerpo["datos"].first["leido"]).to be(false)
    end

    it "el detalle trae la versión vigente, los cursos (recurso completo) y los adjuntos" do
      publicar(cursos: [ curso.id ], titulo: "Detalle")
      anuncio_id = cuerpo["id"]

      ver(anuncio_id, por: docente)

      expect(response).to have_http_status(:ok)
      expect(cuerpo["version"]).to include("titulo" => "Detalle")
      expect(cuerpo["cursos"].pluck("id")).to contain_exactly(curso.id)
      expect(cuerpo["adjuntos"]).to eq([])
    end
  end

  # specs/23-convenciones-api.md (Tabla 28) · «el historial de anuncios… ordena por
  # fecha descendente por omisión».
  describe "orden · Tabla 28" do
    it "ordena por fecha de publicación descendente por omisión" do
      travel_to(2.minutes.ago) { publicar(cursos: [ curso.id ], titulo: "Primero") }
      publicar(cursos: [ curso.id ], titulo: "Segundo")

      listar(por: docente)

      expect(cuerpo["datos"].pluck("titulo")).to eq([ "Segundo", "Primero" ])
    end

    it "admite orden=publicado_en:asc para invertirlo" do
      travel_to(2.minutes.ago) { publicar(cursos: [ curso.id ], titulo: "Primero") }
      publicar(cursos: [ curso.id ], titulo: "Segundo")

      listar(por: docente, orden: "publicado_en:asc")

      expect(cuerpo["datos"].pluck("titulo")).to eq([ "Primero", "Segundo" ])
    end
  end

  describe "autorización" do
    %w[directivo docente tutor alumno].each do |rol|
      it "admite a #{rol} a listar y a ver el detalle" do
        publicar(cursos: [ curso.id ])
        usuario = rol == "docente" ? docente : create(:usuario, rol: rol)

        listar(por: usuario)
        expect(response).to have_http_status(:ok)
      end
    end

    it "rechaza sin token con 401" do
      get "/api/v1/anuncios", as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
