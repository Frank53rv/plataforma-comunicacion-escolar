# RF-15 Vinculación de docentes a cursos · CU-04 · RN-02, RN-13
# Pruebas: CP-RF-15 · CP-RF-03 (vinculación como titular)
#
# Tabla 27 · POST /api/v1/cursos/{id}/docentes · directivo.
# Tabla 40 · petición: usuario_id, es_titular. Respuesta: recurso docente_curso.
require "rails_helper"

RSpec.describe "Vinculación de docentes a cursos", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:directivo) { create(:usuario, :directivo) }
  let(:curso) { create(:curso) }

  def vincular(docente_id, es_titular:, a: curso, por: directivo)
    post "/api/v1/cursos/#{a.id}/docentes",
         params: { usuario_id: docente_id, es_titular: es_titular },
         headers: cabecera_de(por), as: :json
  end

  # CP-RF-15 · RF-15 (Tabla 10): «El sistema debe permitir vincular uno o varios
  # docentes a un mismo curso, distinguiendo mediante un atributo de la vinculación
  # cuál posee las atribuciones de titular.»
  it "CP-RF-15 · vincula a dos docentes y deja un solo titular vigente" do
    titular = create(:usuario, :docente)
    otro = create(:usuario, :docente)

    vincular(titular.id, es_titular: true)
    expect(response).to have_http_status(:created)
    vincular(otro.id, es_titular: false)
    expect(response).to have_http_status(:created)

    vigentes = curso.vinculaciones_docentes.vigentes
    expect(vigentes.pluck(:usuario_id)).to contain_exactly(titular.id, otro.id)
    expect(vigentes.titulares.pluck(:usuario_id)).to eq([ titular.id ])
  end

  # CP-RF-03 · RF-03 (Tabla 10): «El directivo debe poder registrar docentes y
  # asignarlos a uno o varios cursos, indicando en la vinculación cuál de ellos es el
  # titular.»
  it "CP-RF-03 · alta del docente y vinculación como titular, de extremo a extremo" do
    post "/api/v1/docentes",
         params: { nombre: "Docente", apellido: "Titular", correo: "titular@ejemplo.test" },
         headers: cabecera_de(directivo), as: :json
    docente_id = cuerpo["usuario"]["id"]
    expect(cuerpo["codigo_activacion"]["codigo"]).to be_present

    vincular(docente_id, es_titular: true)

    expect(response).to have_http_status(:created)
    expect(cuerpo).to include("usuario_id" => docente_id, "curso_id" => curso.id,
                              "es_titular" => true, "vigente_hasta" => nil)
    expect(curso.vinculaciones_docentes.vigentes.titulares.sole.usuario_id).to eq(docente_id)
  end

  # RF-15 · «uno o varios docentes a un mismo curso»; RF-03 · «a uno o varios cursos».
  it "vincula a un mismo docente con varios cursos" do
    docente = create(:usuario, :docente)
    otro_curso = create(:curso, anio_lectivo: curso.anio_lectivo)

    vincular(docente.id, es_titular: true)
    vincular(docente.id, es_titular: false, a: otro_curso)

    expect(DocenteCurso.vigentes.where(usuario_id: docente.id).count).to eq(2)
  end

  it "responde el recurso docente_curso de la Tabla 40" do
    docente = create(:usuario, :docente)

    freeze_time do
      vincular(docente.id, es_titular: false)

      expect(cuerpo.keys).to contain_exactly("id", "usuario_id", "curso_id", "es_titular",
                                             "vigente_desde", "vigente_hasta")
      expect(cuerpo["vigente_desde"]).to eq(Time.current.to_date.iso8601)
    end
  end

  # El docente se vincula antes de activar su cuenta (RF-03, RF-05, RF-15).
  it "vincula al docente todavía pendiente de activación" do
    pendiente = create(:usuario, :docente, :pendiente)

    vincular(pendiente.id, es_titular: false)

    expect(response).to have_http_status(:created)
  end

  describe "rechazos" do
    # Tabla 14 · «Un único titular vigente por curso» · Tabla 38 · RN-13
    it "rechaza un segundo titular vigente con 409 y RN-13" do
      create(:docente_curso, curso: curso, es_titular: true)

      vincular(create(:usuario, :docente).id, es_titular: true)

      expect(response).to have_http_status(:conflict)
      expect(cuerpo["regla"]).to eq("RN-13")
      expect(curso.vinculaciones_docentes.vigentes.titulares.count).to eq(1)
    end

    # Tabla 14 · «Par usuario-curso único entre los vigentes»
    it "rechaza la vinculación repetida con 422" do
      docente = create(:usuario, :docente)
      vincular(docente.id, es_titular: false)

      vincular(docente.id, es_titular: false)

      expect(response).to have_http_status(:unprocessable_content)
    end

    # RN-04 · una persona tiene exactamente un rol
    it "rechaza vincular como docente a quien tiene otro rol" do
      vincular(create(:usuario, :tutor).id, es_titular: false)

      expect(response).to have_http_status(:unprocessable_content)
    end

    # RN-11 · la baja revoca el acceso
    it "rechaza vincular a un docente dado de baja" do
      vincular(create(:usuario, :docente, :dado_de_baja).id, es_titular: false)

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "rechaza la petición sin los campos de la Tabla 40" do
      post "/api/v1/cursos/#{curso.id}/docentes",
           params: { usuario_id: create(:usuario, :docente).id },
           headers: cabecera_de(directivo), as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "responde 404 si el curso no existe" do
      post "/api/v1/cursos/#{SecureRandom.uuid}/docentes",
           params: { usuario_id: create(:usuario, :docente).id, es_titular: false },
           headers: cabecera_de(directivo), as: :json

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "autorización · RN-02" do
    %w[docente tutor alumno].each do |rol|
      it "rechaza a #{rol} con 403 y no vincula" do
        docente = create(:usuario, :docente)

        vincular(docente.id, es_titular: true, por: create(:usuario, rol: rol))

        expect(response).to have_http_status(:forbidden)
        expect(DocenteCurso.count).to eq(0)
      end
    end
  end
end
