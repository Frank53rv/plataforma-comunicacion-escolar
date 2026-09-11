# RF-10 Restricción de baja de tutor vinculado · CU-05 E3 · RN-12
# Prueba: CP-RF-10
#
# Tabla 43 · «Baja de tutor que mantiene un alumno activo · Tutor vinculado a un alumno
# activo · Rechazo 409 con la regla RN-12 consignada.»
require "rails_helper"

RSpec.describe "Restricción de baja de tutor vinculado", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:directivo) { create(:usuario, :directivo) }
  let(:curso) { create(:curso) }
  let(:alumno) { create(:alumno_curso, curso: curso).alumno }
  let(:tutor) { create(:tutor_alumno, alumno: alumno).tutor }

  def dar_de_baja(persona, por: directivo)
    delete "/api/v1/tutores/#{persona.id}", headers: cabecera_de(por), as: :json
  end

  it "CP-RF-10 · rechaza con 409 y RN-12 la baja del tutor con un alumno activo" do
    dar_de_baja(tutor)

    expect(response).to have_http_status(:conflict)
    expect(cuerpo["regla"]).to eq("RN-12")
    expect(tutor.reload.estado).to eq("activo")
  end

  it "el alumno todavía pendiente de activación también es un alumno activo del curso" do
    alumno.update!(estado: "pendiente")

    dar_de_baja(tutor)

    expect(response).to have_http_status(:conflict)
  end

  # «en cualquier curso»
  it "basta con un alumno activo, aunque otro hijo haya sido dado de baja" do
    create(:tutor_alumno, tutor: tutor, alumno: create(:alumno_curso, curso: create(:curso)).alumno)
    alumno.update!(estado: "dado_de_baja")

    dar_de_baja(tutor)

    expect(response).to have_http_status(:conflict)
  end

  it "admite la baja cuando todos sus alumnos fueron dados de baja" do
    alumno.update!(estado: "dado_de_baja")

    dar_de_baja(tutor)

    expect(response).to have_http_status(:ok)
    expect(tutor.reload.estado).to eq("dado_de_baja")
  end

  it "admite la baja cuando su vinculación con el alumno ya no está vigente" do
    TutorAlumno.find_by(tutor_id: tutor.id).update!(vigente_hasta: Time.current.to_date)

    dar_de_baja(tutor)

    expect(response).to have_http_status(:ok)
  end

  # RN-10 antes que RN-12: quien no tiene la potestad no averigua nada del tutor.
  it "el docente sin potestad recibe 403 y no el 409 de la regla" do
    no_titular = create(:docente_curso, curso: curso, es_titular: false).docente

    dar_de_baja(tutor, por: no_titular)

    expect(response).to have_http_status(:forbidden)
  end
end
