# Verificación del motor de notificaciones · Tabla 4 · RN-18, RN-24
# Prueba: CP-RF-31 · CP-RF-32
#
# Objetivo específico 3 (Etapa 1) · «verificando el 100 % de combinaciones de evento y rol
# de la Tabla 4». Tabla 36, incremento 4 · «verificación del motor de notificaciones sobre
# las combinaciones de evento y rol de la Tabla 4; la correspondiente a la edición de un
# anuncio se verifica solo si RF-19 llega a incorporarse». Tres eventos por cuatro roles:
# doce combinaciones. Cada una recorre el motor completo —publicación o emisión, cola,
# envío— con un cliente de push que registra a quién llega.
require "rails_helper"

RSpec.describe "Matriz de notificaciones por evento y rol (Tabla 4)", type: :request do
  include ActiveJob::TestHelper

  ROLES = %i[alumno tutor docente directivo].freeze

  # La cola de la aplicación es Solid Queue; las pruebas usan el adaptador de prueba.
  around do |ejemplo|
    original = ActiveJob::Base.queue_adapter
    ActiveJob::Base.queue_adapter = :test
    ejemplo.run
  ensure
    ActiveJob::Base.queue_adapter = original
  end

  let(:curso) { create(:curso) }
  let(:emisor) { create(:usuario, :docente) }
  let(:docente_del_curso) { create(:usuario, :docente) }
  let(:alumno) { create(:usuario, :alumno) }
  let(:tutor) { create(:usuario, :tutor) }
  let(:directivo) { create(:usuario, :directivo) }
  let(:cliente) { instance_double(ClienteFcm) }
  let(:recibidos) { [] }

  before do
    [ emisor, docente_del_curso ].each { |docente| create(:docente_curso, docente: docente, curso: curso) }
    create(:alumno_curso, alumno: alumno, curso: curso)
    create(:tutor_alumno, tutor: tutor, alumno: alumno)
    [ docente_del_curso, alumno, tutor, directivo ].each do |persona|
      create(:suscripcion_push, usuario: persona, token: "token-#{persona.id}")
    end
    allow(ClienteFcm).to receive(:desde_el_entorno).and_return(cliente)
    allow(cliente).to receive(:enviar) do |token:, **|
      recibidos << token
      ClienteFcm::Resultado.new(estado: :aceptado, codigo: "200")
    end
  end

  def recibe?(persona)
    recibidos.include?("token-#{persona.id}")
  end

  def personas
    { alumno: alumno, tutor: tutor, docente: docente_del_curso, directivo: directivo }
  end

  def publicar_anuncio
    post "/api/v1/anuncios", params: { titulo: "Aviso", cuerpo: "Contenido.", cursos: [ curso.id ] },
                             headers: cabecera_de(emisor), as: :json
  end

  def enviar_mensaje(autor)
    canal = Conversacion.find_by!(curso_id: curso.id)
    allow(EmisionDeMensaje).to receive(:conectados).and_return([])
    EmisionDeMensaje.emitir(conversacion: canal, autor: autor, cuerpo: "Consulta.")
    # El evento reparte un envío por destinatario; cada uno se ejecuta en la pasada siguiente.
    2.times { perform_enqueued_jobs(only: [ NotificacionMensajeJob, EnvioDeMensajeJob ]) }
  end

  # Fila 1 · «Publicación de un anuncio en un curso» · emisor: docente.
  describe "Publicación de un anuncio en un curso" do
    before { perform_enqueued_jobs(only: NotificacionAnuncioJob) { publicar_anuncio } }

    it("alumno · «Sí, si está vinculado al curso»") { expect(recibe?(alumno)).to be(true) }
    it("tutor · «Sí, si tiene un alumno vinculado al curso»") { expect(recibe?(tutor)).to be(true) }
    it("docente · «No»: ni el emisor ni otro docente del curso") do
      expect(recibe?(emisor)).to be(false)
      expect(recibe?(docente_del_curso)).to be(false)
    end
    it("directivo · «No»") { expect(recibe?(directivo)).to be(false) }

    it "ignora el horario y las preferencias, en las dos filas que lo reciben" do
      expect(EntregaAnuncio.where(destinatario_id: [ alumno.id, tutor.id ]).pluck(:canal)).to all(eq("push"))
    end
  end

  # Un alumno o un tutor que no está vinculado al curso no recibe el anuncio de ese curso.
  describe "Publicación · el rol no basta, hace falta el vínculo con el curso" do
    it "no notifica al alumno ni al tutor de otro curso" do
      otro_curso = create(:curso)
      ajeno = create(:usuario, :alumno)
      create(:alumno_curso, alumno: ajeno, curso: otro_curso)
      ajeno_tutor = create(:usuario, :tutor)
      create(:tutor_alumno, tutor: ajeno_tutor, alumno: ajeno)
      [ ajeno, ajeno_tutor ].each { |persona| create(:suscripcion_push, usuario: persona, token: "token-#{persona.id}") }

      perform_enqueued_jobs(only: NotificacionAnuncioJob) { publicar_anuncio }

      expect(recibe?(ajeno)).to be(false)
      expect(recibe?(ajeno_tutor)).to be(false)
    end
  end

  # Fila 2 · «Edición de un anuncio (condicionada a RF-19)». RF-19 es Should have y no se
  # construye: no existe la operación de edición, y por lo tanto ningún rol recibe una
  # notificación por edición. La corrección de un anuncio es una eliminación lógica más una
  # publicación nueva, que notifica según la fila 1.
  describe "Edición de un anuncio (condicionada a RF-19, Should have)" do
    let(:anuncio_id) do
      publicar_anuncio
      JSON.parse(response.body)["id"]
    end

    it "no existe la operación de edición: PATCH /anuncios/{id} no está en el enrutador" do
      expect(Rails.application.routes.routes.any? { |ruta| ruta.verb == "PATCH" && ruta.path.spec.to_s.start_with?("/api/v1/anuncios") })
        .to be(false)
    end

    ROLES.each do |rol|
      it "#{rol} · no se notifica por una edición que no existe" do
        anuncio_id
        perform_enqueued_jobs # las notificaciones de la publicación original
        recibidos.clear

        patch "/api/v1/anuncios/#{anuncio_id}", params: { titulo: "Corregido" }, headers: cabecera_de(emisor), as: :json
        perform_enqueued_jobs

        expect(response).to have_http_status(:forbidden).or have_http_status(:not_found)
        expect(recibe?(personas.fetch(rol))).to be(false)
      end
    end
  end

  # Fila 3 · «Mensaje en un canal grupal del curso» · emisor: cualquier participante.
  describe "Mensaje en un canal grupal del curso" do
    context "cuando escribe el docente" do
      before { enviar_mensaje(emisor) }

      it("tutor · «Sí, si participa del canal»") { expect(recibe?(personas[:tutor])).to be(true) }
      it("alumno · «condicionado a RF-24»: sin canal de alumnos no se notifica") { expect(recibe?(alumno)).to be(false) }
      it("directivo · «No»") { expect(recibe?(directivo)).to be(false) }
      it("el emisor no se notifica a sí mismo") { expect(recibe?(emisor)).to be(false) }
    end

    context "cuando escribe el tutor" do
      before { enviar_mensaje(tutor) }

      it("docente · «Sí, si está vinculado al curso»") { expect(recibe?(docente_del_curso)).to be(true) }
      it("alumno · «condicionado a RF-24»") { expect(recibe?(alumno)).to be(false) }
      it("directivo · «No»") { expect(recibe?(directivo)).to be(false) }
    end

    it "docente desvinculado del curso · deja de ser «vinculado al curso»: no se notifica" do
      DocenteCurso.find_by!(docente: docente_del_curso).update!(vigente_hasta: Time.current.to_date)

      enviar_mensaje(tutor)

      expect(recibe?(docente_del_curso)).to be(false)
    end
  end

  describe "Mensaje · regla «fuera de la franja se difiere»" do
    it "el tutor fuera de su franja no recibe ahora, y su envío queda programado" do
      ahora = Time.current.in_time_zone("America/Asuncion")
      create(:preferencia, usuario: tutor, hora_inicio: (ahora + 2.hours).strftime("%H:%M"),
                           hora_fin: (ahora + 3.hours).strftime("%H:%M"))

      enviar_mensaje(emisor)

      expect(recibe?(tutor)).to be(false)
      expect(EnvioDeMensajeJob).to have_been_enqueued.with(anything, tutor.id)
    end
  end
end
