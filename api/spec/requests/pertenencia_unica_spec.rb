# RF-13 Vinculación de alumnos a cursos · CU-05 E2 · RN-30
# Prueba: CP-RF-13
#
# Tabla 43 · «Vinculación de un alumno a un segundo curso vigente · Alumno ya vinculado y
# otro curso del mismo año · Rechazo 409 con RN-30.»
require "rails_helper"

RSpec.describe "Pertenencia única a curso", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:curso_a) { create(:curso) }
  let(:curso_b) { create(:curso, anio_lectivo: curso_a.anio_lectivo) }
  let(:docente) do
    create(:docente_curso, curso: curso_a).docente.tap do |d|
      create(:docente_curso, curso: curso_b, docente: d)
    end
  end

  def alta_de_alumno(en:, correo: "alumno@ejemplo.test")
    post "/api/v1/alumnos",
         params: { nombre: "Alumno", apellido: "Ficticio", correo: correo, curso_id: en.id },
         headers: cabecera_de(docente), as: :json
  end

  it "CP-RF-13 · rechaza con 409 y RN-30 al alumno ya vinculado en otro curso del mismo año" do
    alta_de_alumno(en: curso_a)
    expect(response).to have_http_status(:created)

    alta_de_alumno(en: curso_b)

    expect(response).to have_http_status(:conflict)
    expect(cuerpo["regla"]).to eq("RN-30")
    alumno = Usuario.find_by(correo: "alumno@ejemplo.test")
    expect(AlumnoCurso.vigentes.where(usuario_id: alumno.id).pluck(:curso_id)).to eq([ curso_a.id ])
  end

  it "rechaza también la segunda vinculación al mismo curso, que tampoco es un curso distinto" do
    alta_de_alumno(en: curso_a)

    alta_de_alumno(en: curso_a)

    expect(response).to have_http_status(:conflict)
    expect(cuerpo["regla"]).to eq("RN-30")
  end

  it "no crea ninguna cuenta ni código en el rechazo" do
    alta_de_alumno(en: curso_a)

    expect { alta_de_alumno(en: curso_b) }
      .not_to change { [ Usuario.count, CodigoActivacion.count, AlumnoCurso.count ] }
  end

  it "vincula sin conflicto a dos alumnos distintos en cursos distintos" do
    alta_de_alumno(en: curso_a, correo: "uno@ejemplo.test")
    alta_de_alumno(en: curso_b, correo: "dos@ejemplo.test")

    expect(response).to have_http_status(:created)
  end

  # El correo de otra persona con otro rol no es el de un alumno: sigue siendo un dato
  # repetido (Tabla 14, correo único; RN-04, un rol por persona).
  it "el correo de una persona con otro rol responde 422 y no 409" do
    create(:usuario, :tutor, correo: "alumno@ejemplo.test")

    alta_de_alumno(en: curso_a)

    expect(response).to have_http_status(:unprocessable_content)
  end
end
