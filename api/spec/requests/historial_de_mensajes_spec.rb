# RF-28 Persistencia e historial de mensajes · CU-12 · RN-23, RN-27, RN-28
# Prueba: CP-RF-28
require "rails_helper"

RSpec.describe "Persistencia e historial de mensajes", type: :request do
  include ActiveJob::TestHelper

  def cuerpo = JSON.parse(response.body)

  let(:curso) { create(:curso) }
  let(:canal) { Conversacion.find_by!(curso_id: curso.id) }
  let(:docente) { create(:usuario, :docente) }
  let(:tutor) { create(:usuario, :tutor) }

  before do
    create(:docente_curso, docente: docente, curso: curso)
    alumno = create(:usuario, :alumno)
    create(:alumno_curso, alumno: alumno, curso: curso)
    create(:tutor_alumno, tutor: tutor, alumno: alumno)
  end

  def emitir(por:, texto: "Hola.", conversacion: canal)
    post "/api/v1/conversaciones/#{conversacion.id}/mensajes", params: { cuerpo: texto },
                                                               headers: cabecera_de(por), as: :json
  end

  def historial(por:, conversacion: canal, **filtros)
    ruta = "/api/v1/conversaciones/#{conversacion.id}/mensajes"
    ruta += "?#{filtros.to_query}" if filtros.any?
    get ruta, headers: cabecera_de(por), as: :json
  end

  # CP-RF-28 · RF-28 (Tabla 10): «El sistema debe persistir la totalidad de los
  # mensajes y permitir su recuperación por fecha y por participante.»
  describe "CP-RF-28 · mensajes de varias jornadas" do
    let!(:dias) do
      [ 3.days.ago, 2.days.ago, 1.day.ago ].map do |momento|
        travel_to(momento) { emitir(por: docente, texto: "Día #{momento.to_date}") }
        momento
      end
    end

    it "recupera la totalidad de los mensajes, paginada" do
      travel_to(1.hour.ago) { emitir(por: tutor, texto: "Respuesta") }

      historial(por: tutor, por_pagina: 3)
      primera = cuerpo
      historial(por: tutor, por_pagina: 3, pagina: 2)
      segunda = cuerpo

      expect(primera).to include("total" => 4, "pagina" => 1, "por_pagina" => 3)
      expect(primera["datos"].size).to eq(3)
      expect(segunda["datos"].size).to eq(1)
      recuperados = (primera["datos"] + segunda["datos"]).pluck("id")
      expect(recuperados).to match_array(Mensaje.where(conversacion: canal).pluck(:id))
    end

    it "recupera por fecha con desde y hasta" do
      historial(por: docente, desde: dias[1].beginning_of_day.iso8601, hasta: dias[1].end_of_day.iso8601)

      expect(cuerpo["datos"].pluck("cuerpo")).to eq([ "Día #{dias[1].to_date}" ])
    end

    it "recupera por participante con remitente_id" do
      emitir(por: tutor, texto: "Del tutor")

      historial(por: docente, remitente_id: tutor.id)

      expect(cuerpo["datos"].pluck("cuerpo")).to eq([ "Del tutor" ])
    end
  end

  describe "forma y orden · openapi.yaml, Tabla 28" do
    it "responde cada mensaje con conversacion_id, autor completo, cuerpo y enviado_en" do
      emitir(por: tutor, texto: "Consulta")

      historial(por: docente)

      mensaje = cuerpo["datos"].first
      expect(mensaje.keys).to contain_exactly("id", "conversacion_id", "autor", "cuerpo", "enviado_en")
      expect(mensaje).to include("conversacion_id" => canal.id, "cuerpo" => "Consulta")
      expect(mensaje["autor"]).to include("id" => tutor.id, "nombre" => tutor.nombre, "rol" => "tutor")
    end

    it "ordena por fecha de envío descendente por omisión" do
      travel_to(2.minutes.ago) { emitir(por: docente, texto: "Primero") }
      emitir(por: docente, texto: "Segundo")

      historial(por: docente)

      expect(cuerpo["datos"].pluck("cuerpo")).to eq(%w[Segundo Primero])
    end

    it "admite orden=enviado_en:asc para invertirlo" do
      travel_to(2.minutes.ago) { emitir(por: docente, texto: "Primero") }
      emitir(por: docente, texto: "Segundo")

      historial(por: docente, orden: "enviado_en:asc")

      expect(cuerpo["datos"].pluck("cuerpo")).to eq(%w[Primero Segundo])
    end
  end

  # RF-25, RF-28 · emitir, persistir, difundir y encolar la notificación.
  describe "emisión de un mensaje" do
    it "lo persiste con su autor y su hora de envío, y responde 201 con el recurso" do
      freeze_time do
        emitir(por: tutor, texto: "¿Hay clases mañana?")

        expect(response).to have_http_status(:created)
        mensaje = Mensaje.find(cuerpo["id"])
        expect(mensaje).to have_attributes(conversacion_id: canal.id, autor_id: tutor.id,
                                           cuerpo: "¿Hay clases mañana?", enviado_en: Time.current)
        expect(cuerpo["autor"]).to include("id" => tutor.id)
      end
    end

    it "lo difunde a los conectados a la conversación" do
      expect { emitir(por: docente, texto: "Aviso") }
        .to have_broadcasted_to(canal).from_channel(ConversacionChannel)
        .with(hash_including("cuerpo" => "Aviso", "conversacion_id" => canal.id))
    end

    it "encola la notificación del mensaje (RF-32, módulo E)" do
      emitir(por: docente, texto: "Aviso")

      expect(NotificacionMensajeJob).to have_been_enqueued.with(cuerpo["id"])
    end

    it "rechaza con 422 un mensaje sin cuerpo" do
      emitir(por: docente, texto: "")

      expect(response).to have_http_status(:unprocessable_content)
      expect(Mensaje.count).to eq(0)
    end

    it "no admite adjuntos: RF-30 es Should have" do
      post "/api/v1/conversaciones/#{canal.id}/mensajes",
           params: { cuerpo: "Con adjunto", adjuntos: [ SecureRandom.uuid ] },
           headers: cabecera_de(docente), as: :json

      expect(response).to have_http_status(:created)
      expect(cuerpo).not_to have_key("adjuntos")
    end
  end

  describe "RN-27 y RN-28 · la base es la única fuente de verdad" do
    it "el historial se sirve de la base y conserva los mensajes de un docente dado de baja" do
      emitir(por: docente, texto: "Antes de la baja")
      docente.update!(estado: "dado_de_baja")

      historial(por: tutor)

      expect(cuerpo["datos"].first).to include("cuerpo" => "Antes de la baja")
      expect(cuerpo["datos"].first["autor"]).to include("id" => docente.id, "estado" => "dado_de_baja")
    end
  end

  describe "acceso" do
    it "responde 404 si la conversación no existe" do
      get "/api/v1/conversaciones/#{SecureRandom.uuid}/mensajes", headers: cabecera_de(docente), as: :json
      expect(response).to have_http_status(:not_found)
    end

    it "responde 403 a quien no participa de la conversación" do
      historial(por: create(:usuario, :docente))
      expect(response).to have_http_status(:forbidden)
      emitir(por: create(:usuario, :tutor))
      expect(response).to have_http_status(:forbidden)
    end

    it "rechaza al directivo con 403 y sin token con 401" do
      historial(por: create(:usuario, :directivo))
      expect(response).to have_http_status(:forbidden)
      get "/api/v1/conversaciones/#{canal.id}/mensajes", as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
