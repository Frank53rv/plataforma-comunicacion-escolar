# RF-09 Baja lógica de alumnos y tutores · CU-05 flujo B · RN-10, RN-11
# Prueba: CP-RF-09
#
# Tabla 43 · «Baja lógica de alumno y de tutor · Identificador de una persona activa ·
# Acceso revocado, historial y autoría conservados.»
require "rails_helper"

RSpec.describe "Baja lógica de alumnos y tutores", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:directivo) { create(:usuario, :directivo) }
  let(:curso) { create(:curso) }
  let(:titular) { create(:docente_curso, curso: curso, es_titular: true).docente }
  let(:no_titular) { create(:docente_curso, curso: curso, es_titular: false).docente }
  let(:alumno) { create(:alumno_curso, curso: curso).alumno.tap { |a| a.update!(contrasena: "clave-alumno") } }

  def dar_de_baja(persona, por:)
    ruta = persona.alumno? ? "alumnos" : "tutores"
    delete "/api/v1/#{ruta}/#{persona.id}", headers: cabecera_de(por), as: :json
  end

  describe "CP-RF-09 · alumno" do
    it "revoca el acceso y conserva el historial" do
      token = TokenDeSesion.emitir(alumno)[:token]
      tutor = create(:tutor_alumno, alumno: alumno).tutor
      vinculaciones = [ AlumnoCurso.where(usuario_id: alumno.id).count,
                        TutorAlumno.where(alumno_id: alumno.id).count ]

      dar_de_baja(alumno, por: directivo)

      expect(response).to have_http_status(:ok)
      expect(cuerpo).to include("id" => alumno.id, "estado" => "dado_de_baja")

      # acceso revocado: ni la sesión nueva ni la que ya tenía
      post "/api/v1/sesiones", params: { correo: alumno.correo, contrasena: "clave-alumno" }, as: :json
      expect(response).to have_http_status(:unauthorized)
      delete "/api/v1/sesiones", headers: { "Authorization" => "Bearer #{token}" }
      expect(response).to have_http_status(:unauthorized)

      # historial conservado: la cuenta y sus vinculaciones siguen ahí
      expect(Usuario.find(alumno.id)).to be_present
      expect([ AlumnoCurso.where(usuario_id: alumno.id).count,
               TutorAlumno.where(alumno_id: alumno.id).count ]).to eq(vinculaciones)
      expect(Usuario.find(tutor.id).estado).to eq("activo")
    end
  end

  describe "CP-RF-09 · tutor" do
    it "revoca el acceso y conserva sus vinculaciones y su código" do
      alumno.update!(estado: "dado_de_baja")
      tutor = create(:tutor_alumno, alumno: alumno).tutor
      create(:codigo_activacion, usuario: tutor, generador: titular, usado_en: 1.day.ago)

      dar_de_baja(tutor, por: directivo)

      expect(response).to have_http_status(:ok)
      expect(tutor.reload.estado).to eq("dado_de_baja")
      expect(TutorAlumno.where(tutor_id: tutor.id).count).to eq(1)
      expect(CodigoActivacion.where(usuario_id: tutor.id).count).to eq(1)
    end
  end

  # RN-10 · «el directivo o el docente titular del curso. Los demás docentes no tienen
  # esa atribución.»
  describe "potestad de baja · RN-10" do
    it "el docente titular del curso da de baja al alumno" do
      dar_de_baja(alumno, por: titular)

      expect(response).to have_http_status(:ok)
    end

    it "el docente no titular del mismo curso obtiene 403" do
      dar_de_baja(alumno, por: no_titular)

      expect(response).to have_http_status(:forbidden)
      expect(cuerpo["codigo"]).to eq("sin_potestad_de_baja")
      expect(alumno.reload.estado).not_to eq("dado_de_baja")
    end

    it "el titular de otro curso obtiene 403" do
      otro_titular = create(:docente_curso, es_titular: true).docente

      dar_de_baja(alumno, por: otro_titular)

      expect(response).to have_http_status(:forbidden)
    end

    it "el titular del curso de los alumnos del tutor da de baja al tutor" do
      alumno.update!(estado: "dado_de_baja")
      tutor = create(:tutor_alumno, alumno: alumno).tutor

      dar_de_baja(tutor, por: titular)

      expect(response).to have_http_status(:ok)
    end

    %w[tutor alumno].each do |rol|
      it "rechaza a #{rol} con 403" do
        dar_de_baja(alumno, por: create(:usuario, rol: rol))

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  it "responde 404 si el identificador no es de un alumno" do
    delete "/api/v1/alumnos/#{create(:usuario, :tutor).id}", headers: cabecera_de(directivo), as: :json

    expect(response).to have_http_status(:not_found)
  end

  it "responde 404 si el identificador no es de un tutor" do
    delete "/api/v1/tutores/#{alumno.id}", headers: cabecera_de(directivo), as: :json

    expect(response).to have_http_status(:not_found)
  end

  it "dar de baja a quien ya fue dado de baja no altera nada y responde el recurso" do
    dar_de_baja(alumno, por: directivo)

    dar_de_baja(alumno, por: directivo)

    expect(response).to have_http_status(:ok)
    expect(cuerpo["estado"]).to eq("dado_de_baja")
  end
end
