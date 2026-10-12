# RF-36 Idempotencia del registro de eventos · CU-10 · RN-32
# Prueba: CP-RF-36
require "rails_helper"

RSpec.describe "Idempotencia del registro de eventos", type: :request do
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

  def publicar
    post "/api/v1/anuncios", params: { titulo: "Aviso", cuerpo: "Contenido.", cursos: [ curso.id ] },
                             headers: cabecera_de(docente), as: :json
    AnuncioVersion.find_by!(anuncio_id: cuerpo["id"])
  end

  def entrega_de(version, usuario)
    EntregaAnuncio.find_by!(anuncio_version_id: version.id, destinatario_id: usuario.id)
  end

  def leer(version_id, por:)
    post "/api/v1/entregas/lecturas", params: { anuncio_version_id: version_id },
                                       headers: cabecera_de(por), as: :json
  end

  # CP-RF-36 · RF-36 (Tabla 10): «El registro de un evento de estado debe ser
  # idempotente: la reemisión del mismo evento no altera la marca de tiempo original.»
  # Postcondición de CU-10 (Tabla 13): «Los estados vista y leída quedan registrados con
  # marca de tiempo, de forma monótona e idempotente.»
  describe "CP-RF-36 · reemisión del mismo evento" do
    it "la primera lectura registra leida_en y responde la entrega" do
      version = publicar

      leer(version.id, por: alumno)

      expect(response).to have_http_status(:ok)
      expect(cuerpo).to include("id" => entrega_de(version, alumno).id,
                                "anuncio_version_id" => version.id, "destinatario_id" => alumno.id)
      expect(cuerpo["leida_en"]).to be_present
    end

    it "la reemisión no altera la marca original y responde igual que la primera vez" do
      version = publicar

      travel_to(1.minute.from_now.change(usec: 0)) { leer(version.id, por: alumno) }
      primera = cuerpo
      travel_to(1.hour.from_now) { leer(version.id, por: alumno) }
      segunda = cuerpo

      expect(response).to have_http_status(:ok)
      expect(segunda).to eq(primera)
    end

    it "la marca original queda intacta en la base tras la reemisión" do
      version = publicar
      leer(version.id, por: alumno)
      original = entrega_de(version, alumno).leida_en

      travel_to(1.day.from_now) { leer(version.id, por: alumno) }

      expect(entrega_de(version, alumno).leida_en).to eq(original)
    end
  end

  describe "monotonía (RN-32)" do
    it "la lectura completa entregada y vista con la misma marca" do
      version = publicar

      leer(version.id, por: tutor)
      entrega = entrega_de(version, tutor)

      expect([ entrega.entregada_en, entrega.vista_en, entrega.leida_en ].uniq.size).to eq(1)
      expect(entrega.estado_actual).to eq("leida")
    end

    it "un tutor lee la suya sin alterar la de su hijo" do
      version = publicar

      leer(version.id, por: tutor)

      expect(entrega_de(version, alumno).leida_en).to be_nil
    end
  end

  describe "acceso" do
    it "responde 404 si la publicación no tiene fila de entrega para quien pide" do
      version = publicar

      leer(version.id, por: create(:usuario, :alumno))

      expect(response).to have_http_status(:not_found)
    end

    it "responde 404 si la publicación no existe" do
      leer(SecureRandom.uuid, por: alumno)
      expect(response).to have_http_status(:not_found)
    end

    it "rechaza con 403 al docente y al directivo" do
      version = publicar
      leer(version.id, por: docente)
      expect(response).to have_http_status(:forbidden)
      leer(version.id, por: create(:usuario, :directivo))
      expect(response).to have_http_status(:forbidden)
    end

    it "rechaza sin token con 401" do
      post "/api/v1/entregas/lecturas", params: { anuncio_version_id: SecureRandom.uuid }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end

    it "rechaza con 422 si falta la publicación" do
      post "/api/v1/entregas/lecturas", params: {}, headers: cabecera_de(alumno), as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
