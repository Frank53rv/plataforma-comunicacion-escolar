# RF-31 Notificación de anuncios · CU-06, CU-14 · RN-18
# Prueba: CP-RF-31
require "rails_helper"

RSpec.describe "Notificación de anuncios", type: :request do
  include ActiveJob::TestHelper

  def cuerpo = JSON.parse(response.body)

  let(:curso) { create(:curso) }
  let(:docente) { create(:usuario, :docente) }
  let(:alumno) { create(:usuario, :alumno) }
  let(:tutor) { create(:usuario, :tutor) }
  let(:cliente) { instance_double(ClienteFcm) }

  before do
    create(:docente_curso, docente: docente, curso: curso)
    create(:alumno_curso, alumno: alumno, curso: curso)
    create(:tutor_alumno, tutor: tutor, alumno: alumno)
    allow(ClienteFcm).to receive(:desde_el_entorno).and_return(cliente)
    allow(cliente).to receive(:enviar).and_return(ClienteFcm::Resultado.new(estado: :aceptado, codigo: "200"))
  end

  def publicar(titulo: "Reunión de padres", texto: "Se realizará el viernes a las 18:00.")
    post "/api/v1/anuncios", params: { titulo: titulo, cuerpo: texto, cursos: [ curso.id ] },
                             headers: cabecera_de(docente), as: :json
  end

  def entrega_de(usuario)
    EntregaAnuncio.find_by!(destinatario_id: usuario.id)
  end

  # CP-RF-31 · RF-31 (Tabla 10): «El sistema debe emitir una notificación push a cada
  # destinatario al publicarse un anuncio, con independencia de su horario de
  # disponibilidad. Los anuncios institucionales no son configurables por el destinatario.»
  # Postcondición de CU-06 (Tabla 13): «El anuncio queda publicado, los destinatarios
  # resueltos y las filas de entrega creadas en estado enviada.»
  describe "CP-RF-31 · push a cada destinatario al publicarse" do
    it "emite una notificación por destinatario, con el título y el cuerpo del anuncio" do
      tokens = { alumno => "token-alumno", tutor => "token-tutor" }
      tokens.each { |persona, token| create(:suscripcion_push, usuario: persona, token: token) }

      perform_enqueued_jobs { publicar }

      expect(cliente).to have_received(:enviar)
        .with(token: "token-alumno", titulo: "Reunión de padres", cuerpo: "Se realizará el viernes a las 18:00.")
      expect(cliente).to have_received(:enviar)
        .with(token: "token-tutor", titulo: "Reunión de padres", cuerpo: "Se realizará el viernes a las 18:00.")
    end

    it "deja cada fila en canal push y espera su acuse" do
      create(:suscripcion_push, usuario: alumno)

      publicar
      expect { perform_enqueued_jobs(only: NotificacionAnuncioJob) }
        .to have_enqueued_job(VerificacionDeAcuseJob).with(entrega_de(alumno).id)

      expect(entrega_de(alumno)).to have_attributes(canal: "push", causa_fallo: nil)
    end

    it "no notifica al docente autor, que no es destinatario" do
      create(:suscripcion_push, usuario: docente)

      perform_enqueued_jobs { publicar }

      expect(cliente).not_to have_received(:enviar)
    end
  end

  # RN-18 · «Los anuncios ignoran el horario de disponibilidad y las preferencias del
  # destinatario: son comunicación institucional.»
  describe "RN-18 · independencia del horario y de las preferencias" do
    it "notifica a quien tiene recibir_mensajes en falso" do
      create(:suscripcion_push, usuario: tutor)
      create(:preferencia, usuario: tutor, recibir_mensajes: false)

      perform_enqueued_jobs(only: NotificacionAnuncioJob) { publicar }

      expect(cliente).to have_received(:enviar).once
      expect(entrega_de(tutor).canal).to eq("push")
    end

    it "notifica fuera de la franja de disponibilidad, sin diferir" do
      create(:suscripcion_push, usuario: alumno)
      # Una franja que excluye el instante actual sea cual sea la hora en que corra la prueba.
      ahora = Time.current.in_time_zone("America/Asuncion")
      inicio = (ahora + 2.hours).strftime("%H:%M")
      fin = (ahora + 3.hours).strftime("%H:%M")
      create(:preferencia, usuario: alumno, hora_inicio: inicio, hora_fin: fin)

      perform_enqueued_jobs { publicar }

      expect(cliente).to have_received(:enviar).once
    end
  end

  describe "sin suscripción vigente · RF-37" do
    it "la fila queda en la aplicación con la causa registrada" do
      perform_enqueued_jobs { publicar }

      expect(entrega_de(tutor)).to have_attributes(canal: "aplicacion", causa_fallo: "falta_de_soporte_del_navegador")
      expect(cliente).not_to have_received(:enviar)
    end
  end

  describe "RNF-11 · la indisponibilidad del servicio no impide publicar" do
    it "publica y responde 201 aunque el proveedor falle" do
      allow(cliente).to receive(:enviar).and_return(ClienteFcm::Resultado.new(estado: :transitorio, codigo: "503"))
      create(:suscripcion_push, usuario: alumno)

      perform_enqueued_jobs { publicar }

      expect(response).to have_http_status(:created)
      expect(entrega_de(alumno)).to have_attributes(canal: "aplicacion", causa_fallo: "indisponibilidad_del_servicio_push")
    end
  end

  describe "el acuse ya recibido" do
    it "no se vuelve a notificar una entrega ya acusada" do
      create(:suscripcion_push, usuario: alumno)
      publicar
      entrega_de(alumno).registrar_estado("entregada")

      perform_enqueued_jobs(only: NotificacionAnuncioJob)

      expect(cliente).not_to have_received(:enviar)
    end
  end
end
