# RF-14 Vinculación de tutores a alumnos · CU-05 E1 y flujo A · RN-04, RN-29
# Prueba: CP-RF-14
#
# Tabla 43 · «Vinculación de un tercer tutor · Alumno con dos tutores vigentes ·
# Rechazo 409 con RN-29.»
require "rails_helper"

RSpec.describe "Vinculación de tutores a alumnos", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:curso) { create(:curso) }
  let(:docente) { create(:docente_curso, curso: curso).docente }
  let(:alumno) { create(:alumno_curso, curso: curso).alumno }

  def vincular_tutor(correo, a: alumno, por: docente)
    post "/api/v1/alumnos/#{a.id}/tutores",
         params: { nombre: "Tutor", apellido: "Ficticio", correo: correo },
         headers: cabecera_de(por), as: :json
  end

  describe "CP-RF-14 · RN-29" do
    before do
      vincular_tutor("uno@ejemplo.test")
      vincular_tutor("dos@ejemplo.test")
    end

    it "rechaza al tercer tutor con 409 y RN-29, sin crear cuenta, código ni vinculación" do
      expect { vincular_tutor("tres@ejemplo.test") }
        .not_to change { [ Usuario.count, CodigoActivacion.count, TutorAlumno.count ] }

      expect(response).to have_http_status(:conflict)
      expect(cuerpo["regla"]).to eq("RN-29")
    end

    it "rechaza también a un tutor ya existente como tercero" do
      existente = create(:usuario, :tutor, correo: "existente@ejemplo.test")

      vincular_tutor(existente.correo)

      expect(response).to have_http_status(:conflict)
      expect(cuerpo["regla"]).to eq("RN-29")
    end

    # «mientras los dos anteriores permanezcan vigentes»
    it "admite a otro tutor cuando uno de los dos deja de estar vigente" do
      TutorAlumno.vigentes.where(alumno_id: alumno.id).first.update!(vigente_hasta: Time.current.to_date)

      vincular_tutor("tres@ejemplo.test")

      expect(response).to have_http_status(:created)
    end
  end

  # RF-14 · un mismo tutor con varios hijos, aun en cursos distintos, opera con una
  # sola cuenta y sin perfiles separados: «bajo una única cuenta».
  describe "el tutor que ya existe" do
    it "se vincula a un segundo hijo de otro curso con la misma cuenta y sin código nuevo" do
      vincular_tutor("familia@ejemplo.test")
      tutor_id = cuerpo["usuario"]["id"]

      otro_curso = create(:curso)
      otro_docente = create(:docente_curso, curso: otro_curso).docente
      hermano = create(:alumno_curso, curso: otro_curso).alumno

      expect { vincular_tutor("familia@ejemplo.test", a: hermano, por: otro_docente) }
        .to change(TutorAlumno, :count).by(1)
        .and not_change(Usuario, :count)
        .and not_change(CodigoActivacion, :count)

      expect(response).to have_http_status(:created)
      expect(cuerpo["usuario"]["id"]).to eq(tutor_id)
      expect(cuerpo["codigo_activacion"]).to be_nil
      expect(TutorAlumno.vigentes.where(tutor_id: tutor_id).pluck(:alumno_id))
        .to contain_exactly(alumno.id, hermano.id)
    end

    it "rechaza con 422 vincular dos veces al mismo tutor con el mismo alumno" do
      vincular_tutor("familia@ejemplo.test")

      vincular_tutor("familia@ejemplo.test")

      expect(response).to have_http_status(:unprocessable_content)
      expect(TutorAlumno.vigentes.where(alumno_id: alumno.id).count).to eq(1)
    end

    # RN-04 · una persona tiene exactamente un rol
    it "rechaza con 422 el correo de una persona con otro rol" do
      create(:usuario, :docente, correo: "docente@ejemplo.test")

      vincular_tutor("docente@ejemplo.test")

      expect(response).to have_http_status(:unprocessable_content)
      expect(TutorAlumno.count).to eq(0)
    end

    it "rechaza con 422 al tutor dado de baja" do
      create(:usuario, :tutor, :dado_de_baja, correo: "baja@ejemplo.test")

      vincular_tutor("baja@ejemplo.test")

      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
