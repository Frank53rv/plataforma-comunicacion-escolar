# RF-32 Notificación de mensajes · CU-12, CU-14 · RN-24
# Prueba: CP-RF-32
require "rails_helper"

RSpec.describe "Notificación de mensajes", type: :model do
  include ActiveJob::TestHelper

  around do |ejemplo|
    original = ActiveJob::Base.queue_adapter
    ActiveJob::Base.queue_adapter = :test
    ejemplo.run
  ensure
    ActiveJob::Base.queue_adapter = original
  end

  let(:curso) { create(:curso, nombre: "Primero A") }
  let(:canal) { Conversacion.find_by!(curso_id: curso.id) }
  let(:docente) { create(:usuario, :docente, nombre: "Ana") }
  let(:alumno) { create(:usuario, :alumno) }
  let(:tutor) { create(:usuario, :tutor) }
  let(:otro_tutor) { create(:usuario, :tutor) }
  let(:cliente) { instance_double(ClienteFcm) }
  let(:aceptado) { ClienteFcm::Resultado.new(estado: :aceptado, codigo: "200") }

  before do
    create(:docente_curso, docente: docente, curso: curso)
    create(:alumno_curso, alumno: alumno, curso: curso)
    create(:tutor_alumno, tutor: tutor, alumno: alumno)
    allow(ClienteFcm).to receive(:desde_el_entorno).and_return(cliente)
    allow(cliente).to receive(:enviar).and_return(aceptado)
  end

  def suscribir(usuario, token: "token-#{usuario.rol}-#{usuario.id.first(4)}")
    create(:suscripcion_push, usuario: usuario, token: token)
  end

  def emitir_por(autor, texto: "¿Hay clases mañana?", conectados: [])
    allow(EmisionDeMensaje).to receive(:conectados).and_return(conectados)
    EmisionDeMensaje.emitir(conversacion: canal, autor: autor, cuerpo: texto)
  end

  def notificar(mensaje, conectados: [])
    NotificacionMensajeJob.perform_now(mensaje.id, conectados)
    perform_enqueued_jobs(only: EnvioDeMensajeJob)
  end

  # CP-RF-32 · RF-32 (Tabla 10): «El sistema debe emitir notificación por mensaje de
  # conversación aplicando el rol del destinatario, su horario de disponibilidad y sus
  # preferencias; fuera del horario configurado la notificación se difiere, no se
  # descarta.» Postcondición de CU-12 (Tabla 13): «El mensaje queda persistido y difundido
  # a los participantes conectados.»
  describe "CP-RF-32 · dentro y fuera de la franja" do
    it "dentro de la franja, emite el push" do
      suscribir(tutor)
      mensaje = emitir_por(docente)

      notificar(mensaje)

      expect(cliente).to have_received(:enviar).once
    end

    it "fuera de la franja, la difiere hasta el próximo inicio y no la descarta" do
      suscribir(tutor)
      ahora = Time.current.in_time_zone("America/Asuncion")
      inicio = (ahora + 2.hours).change(sec: 0, usec: 0)
      create(:preferencia, usuario: tutor, hora_inicio: inicio.strftime("%H:%M"),
                           hora_fin: (inicio + 1.hour).strftime("%H:%M"))
      mensaje = emitir_por(docente)

      NotificacionMensajeJob.perform_now(mensaje.id, [])

      expect(cliente).not_to have_received(:enviar)
      expect(EnvioDeMensajeJob).to have_been_enqueued.with(mensaje.id, tutor.id).at(inicio)
    end

    it "al llegar el inicio de la franja, el envío diferido sale" do
      suscribir(tutor)
      ahora = Time.current.in_time_zone("America/Asuncion")
      create(:preferencia, usuario: tutor, hora_inicio: (ahora + 2.hours).strftime("%H:%M"),
                           hora_fin: (ahora + 3.hours).strftime("%H:%M"))
      mensaje = emitir_por(docente)
      NotificacionMensajeJob.perform_now(mensaje.id, [])

      travel_to(ahora + 2.hours + 1.second) { EnvioDeMensajeJob.perform_now(mensaje.id, tutor.id) }

      expect(cliente).to have_received(:enviar).once
    end

    it "no agrupa: tres mensajes diferidos son tres envíos" do
      suscribir(tutor)
      ahora = Time.current.in_time_zone("America/Asuncion")
      create(:preferencia, usuario: tutor, hora_inicio: (ahora + 2.hours).strftime("%H:%M"),
                           hora_fin: (ahora + 3.hours).strftime("%H:%M"))
      mensajes = 3.times.map { |n| emitir_por(docente, texto: "Mensaje #{n}") }

      mensajes.each { |mensaje| NotificacionMensajeJob.perform_now(mensaje.id, []) }

      expect(enqueued_jobs.count { |trabajo| trabajo["job_class"] == "EnvioDeMensajeJob" }).to eq(3)
    end

    it "una franja que cruza la medianoche difiere hasta su inicio del mismo día" do
      suscribir(tutor)
      create(:preferencia, usuario: tutor, hora_inicio: "22:00", hora_fin: "07:00")
      mensaje = emitir_por(docente)

      travel_to(Time.find_zone("America/Asuncion").parse("2026-03-02 12:00")) do
        NotificacionMensajeJob.perform_now(mensaje.id, [])
      end

      esperado = Time.find_zone("America/Asuncion").parse("2026-03-02 22:00")
      expect(EnvioDeMensajeJob).to have_been_enqueued.with(mensaje.id, tutor.id).at(esperado)
    end
  end

  describe "preferencias · RN-24: nada se silencia" do
    it "con recibir_mensajes en falso no se emite push, y el mensaje sigue en la conversación" do
      suscribir(tutor)
      create(:preferencia, usuario: tutor, recibir_mensajes: false)
      mensaje = emitir_por(docente)

      notificar(mensaje)

      expect(cliente).not_to have_received(:enviar)
      expect(canal.mensajes.pluck(:id)).to include(mensaje.id)
    end
  end

  describe "a quién se notifica · rol del destinatario (Tabla 4)" do
    it "el docente escribe: se notifica al tutor, no a él ni al alumno" do
      [ docente, alumno, tutor ].each { |persona| suscribir(persona) }
      mensaje = emitir_por(docente)

      notificar(mensaje)

      expect(cliente).to have_received(:enviar).once
    end

    it "el tutor escribe: se notifica al docente y al otro tutor del canal, no a él ni al alumno" do
      create(:tutor_alumno, tutor: otro_tutor, alumno: alumno)
      [ docente, tutor, otro_tutor, alumno ].each { |persona| suscribir(persona) }
      mensaje = emitir_por(tutor)

      notificar(mensaje)

      # El otro tutor también integra el canal grupal: se notifica al docente y a él.
      expect(cliente).to have_received(:enviar).twice
    end

    it "nunca se notifica al directivo ni al alumno" do
      directivo = create(:usuario, :directivo)
      [ directivo, alumno ].each { |persona| suscribir(persona) }
      mensaje = emitir_por(docente)

      notificar(mensaje)

      expect(cliente).not_to have_received(:enviar)
    end

    it "no se notifica a quien ya está conectado a la conversación" do
      suscribir(tutor)
      mensaje = emitir_por(docente, conectados: [ tutor.id ])

      NotificacionMensajeJob.perform_now(mensaje.id, [ tutor.id ])

      expect(EnvioDeMensajeJob).not_to have_been_enqueued
    end

    it "no se notifica a quien dejó de estar vinculado al curso" do
      suscribir(tutor)
      TutorAlumno.find_by!(tutor: tutor).update!(vigente_hasta: Time.current.to_date)
      mensaje = emitir_por(docente)

      notificar(mensaje)

      expect(cliente).not_to have_received(:enviar)
    end
  end

  describe "el contenido del push" do
    it "lleva el curso, el autor y el mensaje" do
      suscribir(tutor, token: "tok")
      mensaje = emitir_por(docente, texto: "Mañana hay reunión.")

      notificar(mensaje)

      expect(cliente).to have_received(:enviar)
        .with(token: "tok", titulo: "Primero A", cuerpo: "Ana #{docente.apellido}: Mañana hay reunión.")
    end

    it "recorta un mensaje largo" do
      suscribir(tutor)
      mensaje = emitir_por(docente, texto: "x" * 500)

      notificar(mensaje)

      expect(cliente).to have_received(:enviar) { |cuerpo:, **| expect(cuerpo.length).to be <= 200 }
    end
  end

  describe "RF-37 · fallos del servicio, sin fila de entrega" do
    it "el destino rechazado invalida la suscripción y queda en la bitácora, sin reintentar" do
      suscripcion = suscribir(tutor)
      allow(cliente).to receive(:enviar)
        .and_return(ClienteFcm::Resultado.new(estado: :credencial_invalida, codigo: "UNREGISTERED"))
      mensaje = emitir_por(docente)

      notificar(mensaje)

      expect(suscripcion.reload.estado).to eq("invalida")
      expect(BitacoraEnvio.find_by!(suscripcion_id: suscripcion.id)).to have_attributes(
        causa: "credencial_invalida", codigo_proveedor: "UNREGISTERED", entrega_anuncio_id: nil
      )
    end

    it "el fallo transitorio se reintenta y, agotado, queda en la bitácora" do
      suscripcion = suscribir(tutor)
      allow(cliente).to receive(:enviar)
        .and_return(ClienteFcm::Resultado.new(estado: :transitorio, codigo: "503"))
      mensaje = emitir_por(docente)
      NotificacionMensajeJob.perform_now(mensaje.id, [])

      # El intento inicial y los tres reintentos, cada uno encolado por el anterior.
      (PoliticaDeEnvio::REINTENTOS.size + 1).times { perform_enqueued_jobs(only: EnvioDeMensajeJob) }

      expect(suscripcion.reload.estado).to eq("vigente")
      expect(BitacoraEnvio.find_by!(suscripcion_id: suscripcion.id)).to have_attributes(
        causa: "indisponibilidad_del_servicio_push", codigo_proveedor: "503"
      )
    end

    it "sin suscripción vigente no se hace nada: el mensaje está en la conversación" do
      mensaje = emitir_por(docente)

      notificar(mensaje)

      expect(cliente).not_to have_received(:enviar)
      expect(BitacoraEnvio.count).to eq(0)
    end
  end

  describe "quiénes están conectados (Figura 8)" do
    it "son los usuarios con una suscripción abierta a esa conversación en el proceso web" do
      suscripcion = { "identifier" => { channel: "ConversacionChannel", conversacion_id: canal.id }.to_json }
      conexion = double("conexión", usuario_actual: tutor,
                                    subscriptions: double("suscripciones", identifiers: [ suscripcion["identifier"] ]))
      otra = double("conexión", usuario_actual: alumno, subscriptions: double("suscripciones", identifiers: []))
      allow(ActionCable.server).to receive(:connections).and_return([ conexion, otra ])

      expect(EmisionDeMensaje.conectados(canal)).to eq([ tutor.id ])
    end
  end
end
