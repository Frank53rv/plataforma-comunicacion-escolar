# RF-04 Alta de alumnos y tutores · RF-05 · CU-05 · RN-01, RN-03, RN-05
# Pruebas: CP-RF-04 · CP-RF-05 (de extremo a extremo sobre la operación)
#
# Tabla 27 · POST /api/v1/alumnos y POST /api/v1/alumnos/{id}/tutores · docente.
require "rails_helper"

RSpec.describe "Alta de alumnos y tutores", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:curso) { create(:curso) }
  let(:docente) { create(:docente_curso, curso: curso).docente }

  def alta_de_alumno(correo: "alumno@ejemplo.test", en: curso, por: docente)
    post "/api/v1/alumnos",
         params: { nombre: "Alumno", apellido: "Ficticio", correo: correo, curso_id: en.id },
         headers: cabecera_de(por), as: :json
  end

  def alta_de_tutor(alumno_id, correo:, por: docente)
    post "/api/v1/alumnos/#{alumno_id}/tutores",
         params: { nombre: "Tutor", apellido: "Ficticio", correo: correo },
         headers: cabecera_de(por), as: :json
  end

  # CP-RF-04 · RF-04 (Tabla 10): «El docente debe poder registrar alumnos de sus
  # cursos y hasta dos tutores por alumno.» Postcondición de CU-05 (Tabla 13):
  # «Alumnos y tutores quedan registrados, vinculados o dados de baja, con su código
  # generado.»
  it "CP-RF-04 · alta de un alumno con dos tutores, vinculados y con un código por persona" do
    alta_de_alumno
    expect(response).to have_http_status(:created)
    alumno_id = cuerpo["usuario"]["id"]
    codigos = [ cuerpo["codigo_activacion"]["codigo"] ]
    expect(cuerpo["alumno_curso"]).to include("usuario_id" => alumno_id, "curso_id" => curso.id,
                                              "vigente_hasta" => nil)

    %w[tutor.uno@ejemplo.test tutor.dos@ejemplo.test].each do |correo|
      alta_de_tutor(alumno_id, correo: correo)
      expect(response).to have_http_status(:created)
      expect(cuerpo["usuario"]["rol"]).to eq("tutor")
      expect(cuerpo["tutor_alumno"]).to include("alumno_id" => alumno_id, "vigente_hasta" => nil)
      codigos << cuerpo["codigo_activacion"]["codigo"]
    end

    expect(TutorAlumno.vigentes.where(alumno_id: alumno_id).count).to eq(2)
    expect(codigos.uniq.size).to eq(3)
    expect(CodigoActivacion.where(usuario_id: Usuario.where(correo: [ "alumno@ejemplo.test",
      "tutor.uno@ejemplo.test", "tutor.dos@ejemplo.test" ]).select(:id)).count).to eq(3)
  end

  # CP-RF-05 · RF-05 (Tabla 10): «Al registrar a una persona, el sistema debe generar
  # un código de activación de un solo uso, con vencimiento de siete días, asociado a
  # ella», ahora sobre la operación de alta de tutor.
  it "CP-RF-05 · el alta del tutor genera su código de un solo uso a siete días" do
    alta_de_alumno
    alumno_id = cuerpo["usuario"]["id"]

    freeze_time do
      alta_de_tutor(alumno_id, correo: "tutor@ejemplo.test")

      tutor_id = cuerpo["usuario"]["id"]
      codigo = CodigoActivacion.localizar(cuerpo["codigo_activacion"]["codigo"])
      expect(codigo.usuario_id).to eq(tutor_id)
      expect(codigo.vence_en).to eq(Time.current + 7.days)
      expect(codigo.usado_en).to be_nil
    end

    codigo = cuerpo["codigo_activacion"]["codigo"]
    post "/api/v1/activaciones", params: { codigo: codigo, contrasena: "clave-123" }, as: :json
    expect(response).to have_http_status(:created)
    post "/api/v1/activaciones", params: { codigo: codigo, contrasena: "clave-123" }, as: :json
    expect(response).to have_http_status(:gone)
  end

  it "las personas nacen pendientes y el alta queda atribuida al docente (RN-01)" do
    alta_de_alumno

    alumno = Usuario.find(cuerpo["usuario"]["id"])
    expect(alumno.estado).to eq("pendiente")
    expect(CodigoActivacion.find_by(usuario: alumno).generado_por).to eq(docente.id)
  end

  describe "precondición de CU-05 · el docente está vinculado al curso" do
    it "rechaza con 403 el alta en un curso que no es suyo, sin efectos" do
      otro_curso = create(:curso)

      alta_de_alumno(en: otro_curso)

      expect(response).to have_http_status(:forbidden)
      expect(cuerpo["codigo"]).to eq("docente_no_vinculado_al_curso")
      expect(Usuario.find_by(correo: "alumno@ejemplo.test")).to be_nil
    end

    it "rechaza con 403 el tutor de un alumno ajeno a sus cursos" do
      ajeno = create(:alumno_curso, curso: create(:curso)).alumno

      alta_de_tutor(ajeno.id, correo: "tutor@ejemplo.test")

      expect(response).to have_http_status(:forbidden)
      expect(Usuario.find_by(correo: "tutor@ejemplo.test")).to be_nil
    end

    it "rechaza con 403 un identificador que no es de un alumno" do
      alta_de_tutor(create(:usuario, :tutor).id, correo: "tutor@ejemplo.test")

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "validaciones de forma · 422" do
    it "rechaza el alumno sin los campos de la Tabla 40" do
      post "/api/v1/alumnos", params: { nombre: "Solo", curso_id: curso.id },
           headers: cabecera_de(docente), as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "rechaza la petición sin curso_id" do
      post "/api/v1/alumnos", params: { nombre: "A", apellido: "B", correo: "c@ejemplo.test" },
           headers: cabecera_de(docente), as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "no deja al alumno registrado si la vinculación falla" do
      docente
      allow(AlumnoCurso).to receive(:create!).and_raise(ActiveRecord::RecordInvalid)

      expect { alta_de_alumno }.not_to change(Usuario, :count)
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  # Tabla 27 · ambas operaciones: sólo docente
  describe "autorización" do
    %w[directivo tutor alumno].each do |rol|
      it "rechaza a #{rol} con 403" do
        alta_de_alumno(por: create(:usuario, rol: rol))

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
