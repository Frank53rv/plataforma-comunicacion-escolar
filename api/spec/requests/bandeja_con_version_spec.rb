# RF-35 Registro agrupado de vistas · RF-22 Consulta del historial · CU-09, CU-10 · RN-32
# Prueba: CP-RF-35 · CP-RF-22
require "rails_helper"

# RF-35 (Tabla 10) · «El cliente debe acumular los identificadores de los anuncios que
# ingresan al área visible y emitirlos agrupados en una sola petición.» POST /entregas/vistas
# toma `anuncio_version_ids` (Tabla 29): para que el cliente pueda emitir el lote sin pedir
# el detalle de cada anuncio, cada fila de la bandeja lleva el identificador de la
# publicación vigente. La Tabla 29 describe la fila sin enumerar identificadores.
RSpec.describe "La bandeja identifica la publicación de cada anuncio", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:curso) { create(:curso) }
  let(:docente) { create(:usuario, :docente) }
  let(:alumno) { create(:usuario, :alumno) }
  let(:tutor) { create(:usuario, :tutor) }

  before do
    create(:docente_curso, docente: docente, curso: curso)
    create(:alumno_curso, alumno: alumno, curso: curso)
    create(:tutor_alumno, tutor: tutor, alumno: alumno)
  end

  def publicar(titulo)
    post "/api/v1/anuncios", params: { titulo: titulo, cuerpo: "Contenido.", cursos: [ curso.id ] },
                             headers: cabecera_de(docente), as: :json
    cuerpo.dig("anuncio_version", "id")
  end

  it "cada fila trae el identificador de la publicación vigente" do
    version = publicar("Reunión")

    get "/api/v1/anuncios", headers: cabecera_de(tutor), as: :json

    expect(cuerpo["datos"].first).to include("titulo" => "Reunión", "anuncio_version_id" => version)
  end

  it "los identificadores de la página bastan para emitir las vistas en una sola petición" do
    versiones = %w[Uno Dos Tres].map { |titulo| publicar(titulo) }
    get "/api/v1/anuncios", headers: cabecera_de(alumno), as: :json
    visibles = cuerpo["datos"].pluck("anuncio_version_id")

    post "/api/v1/entregas/vistas", params: { anuncio_version_ids: visibles },
                                    headers: cabecera_de(alumno), as: :json

    expect(visibles).to match_array(versiones)
    expect(cuerpo).to eq("registrada" => 3, "omitida_por_idempotencia" => 0)
  end

  it "también la reciben quienes no son destinatarios: el docente y el directivo" do
    version = publicar("Reunión")

    [ docente, create(:usuario, :directivo) ].each do |persona|
      get "/api/v1/anuncios", headers: cabecera_de(persona), as: :json
      expect(cuerpo["datos"].first["anuncio_version_id"]).to eq(version)
    end
  end
end
