# RF-29 Restricción de participación · CU-12 · RN-23
# Prueba: CP-RF-29
require "rails_helper"

RSpec.describe "Restricción de participación", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:curso) { create(:curso) }
  let(:canal) { Conversacion.find_by!(curso_id: curso.id) }
  let(:docente) { create(:usuario, :docente) }
  let(:alumno) { create(:usuario, :alumno) }
  let(:tutor) { create(:usuario, :tutor) }
  let!(:vinculacion_docente) { create(:docente_curso, docente: docente, curso: curso) }
  let!(:vinculacion_alumno) { create(:alumno_curso, alumno: alumno, curso: curso) }
  let!(:vinculacion_tutor) { create(:tutor_alumno, tutor: tutor, alumno: alumno) }

  # Personas ajenas a la conversación: vinculadas a otro curso, o sin vinculación.
  let(:otro_curso) { create(:curso) }
  let(:docente_ajeno) { create(:usuario, :docente).tap { |d| create(:docente_curso, docente: d, curso: otro_curso) } }
  let(:tutor_ajeno) do
    create(:usuario, :tutor).tap do |t|
      hijo = create(:usuario, :alumno)
      create(:alumno_curso, alumno: hijo, curso: otro_curso)
      create(:tutor_alumno, tutor: t, alumno: hijo)
    end
  end

  def pedir(metodo, por:, conversacion: canal)
    ruta = "/api/v1/conversaciones/#{conversacion.id}/mensajes"
    if metodo == :post
      post ruta, params: { cuerpo: "Intento" }, headers: cabecera_de(por), as: :json
    else
      get ruta, headers: cabecera_de(por), as: :json
    end
  end

  def esperar_rechazo
    expect(response).to have_http_status(:forbidden)
    expect(response.media_type).to eq("application/problem+json")
    expect(cuerpo).to include("status" => 403, "codigo" => "no_participa_de_la_conversacion")
  end

  # CP-RF-29 · «Participación de un usuario no vinculado al curso. Token de un usuario
  # ajeno a la conversación. Suscripción rechazada con 403.»
  describe "CP-RF-29 · usuario ajeno a la conversación" do
    {
      "docente de otro curso" => :docente_ajeno,
      "tutor de un alumno de otro curso" => :tutor_ajeno
    }.each do |quien, ajeno|
      it "rechaza con 403 al #{quien} al consultar el historial y al emitir" do
        pedir(:get, por: send(ajeno))
        esperar_rechazo

        pedir(:post, por: send(ajeno))
        esperar_rechazo
        expect(Mensaje.count).to eq(0)
      end
    end

    it "rechaza con 403 al alumno del curso: el canal de RF-25 no lo integra" do
      pedir(:get, por: alumno)
      esperar_rechazo
      pedir(:post, por: alumno)
      esperar_rechazo
    end

    it "no lista la conversación entre las del usuario ajeno" do
      get "/api/v1/conversaciones", headers: cabecera_de(docente_ajeno), as: :json

      expect(cuerpo["datos"].pluck("id")).not_to include(canal.id)
    end

    it "rechaza con 403 los canales de un curso al que no está vinculado" do
      get "/api/v1/cursos/#{curso.id}/conversaciones", headers: cabecera_de(tutor_ajeno), as: :json

      expect(response).to have_http_status(:forbidden)
      expect(cuerpo).to include("codigo" => "no_vinculado_al_curso")
    end
  end

  # RN-23 · la participación se evalúa contra las vinculaciones vigentes: haber sido
  # participante no conserva el acceso.
  describe "la vinculación terminada revoca la participación" do
    before { pedir(:get, por: docente) }

    it "el docente desvinculado del curso pierde el acceso" do
      expect(canal.participantes.pluck(:usuario_id)).to include(docente.id)
      vinculacion_docente.update!(vigente_hasta: Time.current.to_date)

      pedir(:get, por: docente)
      esperar_rechazo
    end

    it "el tutor desvinculado del alumno pierde el acceso" do
      vinculacion_tutor.update!(vigente_hasta: Time.current.to_date)

      pedir(:post, por: tutor)
      esperar_rechazo
    end

    it "el tutor pierde el acceso cuando su hijo deja el curso" do
      vinculacion_alumno.update!(vigente_hasta: Time.current.to_date)

      pedir(:get, por: tutor)
      esperar_rechazo
    end
  end

  describe "participantes vigentes" do
    it "admite al docente y al tutor vinculados" do
      pedir(:post, por: tutor)
      expect(response).to have_http_status(:created)

      pedir(:get, por: docente)
      expect(response).to have_http_status(:ok)
    end
  end

  describe "orden de los rechazos · Tabla 24" do
    it "responde 404 a una conversación inexistente" do
      get "/api/v1/conversaciones/#{SecureRandom.uuid}/mensajes", headers: cabecera_de(docente), as: :json
      expect(response).to have_http_status(:not_found)
    end

    it "responde 403 por rol al directivo, antes de mirar la conversación" do
      get "/api/v1/conversaciones/#{SecureRandom.uuid}/mensajes",
          headers: cabecera_de(create(:usuario, :directivo)), as: :json
      expect(response).to have_http_status(:forbidden)
      expect(cuerpo).to include("codigo" => "rol_no_autorizado")
    end

    it "responde 401 sin token" do
      post "/api/v1/conversaciones/#{canal.id}/mensajes", params: { cuerpo: "x" }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
