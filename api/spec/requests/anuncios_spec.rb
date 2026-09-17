# RF-17 Publicación de anuncios · CU-06 · RN-16, RN-17, RN-19
# Prueba: CP-RF-17
require "rails_helper"

RSpec.describe "Publicación de anuncios", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:docente) { create(:usuario, :docente) }
  let(:curso_propio) { create(:curso) }

  before { create(:docente_curso, docente: docente, curso: curso_propio) }

  def publicar(cursos:, titulo: "Reunión de padres", cuerpo: "Se informa la reunión del viernes.",
               por: docente, extra: {})
    post "/api/v1/anuncios",
         params: { titulo: titulo, cuerpo: cuerpo, cursos: cursos }.merge(extra),
         headers: cabecera_de(por), as: :json
  end

  # CP-RF-17 · «Publicación sobre un curso asignado y sobre uno ajeno. Anuncio sobre
  # curso propio; luego sobre curso ajeno. El primero se publica; el segundo se rechaza
  # con 403 y sin efectos parciales.»
  describe "CP-RF-17 · publicación" do
    it "publica el anuncio sobre un curso propio, conforme al flujo principal de CU-06" do
      alumno = create(:usuario, :alumno)
      create(:alumno_curso, alumno: alumno, curso: curso_propio)
      tutor = create(:usuario, :tutor)
      create(:tutor_alumno, tutor: tutor, alumno: alumno)

      publicar(cursos: [ curso_propio.id ])

      expect(response).to have_http_status(:created)
      expect(cuerpo["estado"]).to eq("publicado")
      expect(cuerpo["anuncio_version"]).to include("numero_version" => 1, "titulo" => "Reunión de padres")
      expect(cuerpo["destinatarios_resueltos"]).to eq(2)

      anuncio = Anuncio.find(cuerpo["id"])
      expect(anuncio.vinculaciones_curso.pluck(:curso_id)).to contain_exactly(curso_propio.id)
      entregas = anuncio.version_vigente.entregas
      expect(entregas.pluck(:destinatario_id)).to contain_exactly(alumno.id, tutor.id)
      expect(entregas.pluck(:canal).uniq).to eq([ "aplicacion" ])
      expect(entregas.pluck(:enviada_en)).to all(be_present)
    end

    it "rechaza con 403 la publicación sobre un curso ajeno, sin efectos parciales (CU-06 E1)" do
      curso_ajeno = create(:curso)

      publicar(cursos: [ curso_ajeno.id ])

      expect(response).to have_http_status(:forbidden)
      expect(Anuncio.count).to eq(0)
    end

    it "rechaza con 403 si uno de varios cursos es ajeno, sin publicar ni en el propio" do
      curso_ajeno = create(:curso)

      publicar(cursos: [ curso_propio.id, curso_ajeno.id ])

      expect(response).to have_http_status(:forbidden)
      expect(Anuncio.count).to eq(0)
      expect(AnuncioCurso.count).to eq(0)
    end

    it "trata un curso inexistente igual que uno ajeno: 403 y no 404" do
      publicar(cursos: [ SecureRandom.uuid ])

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "RN-19 · resolución de destinatarios en la publicación efectiva" do
    it "incluye a los alumnos vigentes del curso y a sus tutores vigentes" do
      alumno_sin_tutor = create(:usuario, :alumno)
      create(:alumno_curso, alumno: alumno_sin_tutor, curso: curso_propio)
      alumno_dado_de_baja = create(:usuario, :alumno)
      create(:alumno_curso, alumno: alumno_dado_de_baja, curso: curso_propio,
                            vigente_hasta: Date.current)

      publicar(cursos: [ curso_propio.id ])

      destinatarios = Anuncio.last.version_vigente.entregas.pluck(:destinatario_id)
      expect(destinatarios).to contain_exactly(alumno_sin_tutor.id)
    end

    it "no duplica la entrega a un tutor con dos hijos vinculados al mismo curso" do
      tutor = create(:usuario, :tutor)
      alumno_a = create(:usuario, :alumno)
      alumno_b = create(:usuario, :alumno)
      create(:alumno_curso, alumno: alumno_a, curso: curso_propio)
      create(:alumno_curso, alumno: alumno_b, curso: curso_propio)
      create(:tutor_alumno, tutor: tutor, alumno: alumno_a)
      create(:tutor_alumno, tutor: tutor, alumno: alumno_b)

      publicar(cursos: [ curso_propio.id ])

      destinatarios = Anuncio.last.version_vigente.entregas.pluck(:destinatario_id)
      expect(destinatarios).to contain_exactly(alumno_a.id, alumno_b.id, tutor.id)
    end
  end

  # RF-18 (programación) y RF-30 (adjuntos) son Should have (Tabla 10) y no integran este
  # incremento: la publicación es siempre inmediata y sin adjuntos, cualquiera sea el
  # cuerpo de la petición.
  describe "alcance · Boundary 1 · RF-18 y RF-30 no se construyen" do
    it "publica de inmediato aunque se envíe programado_para, sin quedar programado" do
      publicar(cursos: [ curso_propio.id ], extra: { programado_para: 1.day.from_now.iso8601 })

      expect(response).to have_http_status(:created)
      expect(cuerpo["estado"]).to eq("publicado")
      expect(Anuncio.last.programado_para).to be_nil
    end
  end

  describe "validaciones de forma · 422" do
    it "rechaza la petición sin alguno de los tres campos" do
      publicar(cursos: [ curso_propio.id ], titulo: nil)
      expect(response).to have_http_status(:unprocessable_content)

      publicar(cursos: [ curso_propio.id ], cuerpo: nil)
      expect(response).to have_http_status(:unprocessable_content)

      publicar(cursos: [])
      expect(response).to have_http_status(:unprocessable_content)

      expect(Anuncio.count).to eq(0)
    end
  end

  describe "autorización" do
    it "admite al docente" do
      publicar(cursos: [ curso_propio.id ])
      expect(response).to have_http_status(:created)
    end

    %w[directivo tutor alumno].each do |rol|
      it "rechaza a #{rol} con 403, sin efectos" do
        publicar(cursos: [ curso_propio.id ], por: create(:usuario, rol: rol))

        expect(response).to have_http_status(:forbidden)
        expect(Anuncio.count).to eq(0)
      end
    end

    it "rechaza sin token con 401" do
      post "/api/v1/anuncios", params: { titulo: "x", cuerpo: "y", cursos: [ curso_propio.id ] },
           as: :json

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
