# RF-25 Canal grupal del curso · RF-28 Persistencia e historial de mensajes · RF-29
# Restricción de participación · CU-12 · RN-23
# Prueba: CP-RF-25 · CP-RF-28 · CP-RF-29
require "rails_helper"

RSpec.describe ConversacionChannel, type: :channel do
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

  # CP-RF-25 · el canal grupal está disponible en tiempo real para sus integrantes.
  describe "CP-RF-25 · suscripción al canal grupal" do
    it "confirma la suscripción del docente y la transmite por la conversación" do
      stub_connection usuario_actual: docente

      subscribe(conversacion_id: canal.id)

      expect(subscription).to be_confirmed
      expect(subscription).to have_stream_for(canal)
    end

    it "confirma la suscripción del tutor y lo registra como participante" do
      stub_connection usuario_actual: tutor

      subscribe(conversacion_id: canal.id)

      expect(subscription).to be_confirmed
      expect(canal.participantes.pluck(:usuario_id)).to include(tutor.id)
    end
  end

  # CP-RF-29 · RF-29 (Tabla 10): «El sistema debe impedir la participación de
  # cualquier usuario en una conversación de un curso al que no se encuentre
  # vinculado.»
  describe "CP-RF-29 · suscripción de un usuario ajeno" do
    let(:otro_curso) { create(:curso) }

    def rechaza_a(usuario)
      stub_connection usuario_actual: usuario
      subscribe(conversacion_id: canal.id)
      expect(subscription).to be_rejected
    end

    it "rechaza al docente de otro curso" do
      ajeno = create(:usuario, :docente)
      create(:docente_curso, docente: ajeno, curso: otro_curso)
      rechaza_a(ajeno)
    end

    it "rechaza al tutor de un alumno de otro curso" do
      ajeno = create(:usuario, :tutor)
      hijo = create(:usuario, :alumno)
      create(:alumno_curso, alumno: hijo, curso: otro_curso)
      create(:tutor_alumno, tutor: ajeno, alumno: hijo)
      rechaza_a(ajeno)
    end

    it "rechaza al alumno del curso, que el canal de RF-25 no integra" do
      rechaza_a(AlumnoCurso.find_by!(curso: curso).alumno)
    end

    it "rechaza al directivo" do
      rechaza_a(create(:usuario, :directivo))
    end

    it "rechaza al docente cuya vinculación terminó" do
      DocenteCurso.find_by!(docente: docente).update!(vigente_hasta: Time.current.to_date)
      rechaza_a(docente)
    end

    it "rechaza una conversación inexistente" do
      stub_connection usuario_actual: docente
      subscribe(conversacion_id: SecureRandom.uuid)
      expect(subscription).to be_rejected
    end
  end

  # CP-RF-28 · Figura 8 · el mensaje emitido por el canal se persiste, se difunde a los
  # conectados y encola su notificación, igual que por la vía HTTP.
  describe "CP-RF-28 · emisión por el canal" do
    include ActiveJob::TestHelper

    it "persiste, difunde y encola el mensaje emitido" do
      stub_connection usuario_actual: tutor
      subscribe(conversacion_id: canal.id)

      expect { perform :emitir, cuerpo: "Por el canal" }
        .to have_broadcasted_to(canal).with(hash_including("cuerpo" => "Por el canal"))

      mensaje = Mensaje.find_by!(cuerpo: "Por el canal")
      expect(mensaje).to have_attributes(conversacion_id: canal.id, autor_id: tutor.id)
      expect(NotificacionMensajeJob).to have_been_enqueued.with(mensaje.id)
    end

    it "no persiste un mensaje sin cuerpo" do
      stub_connection usuario_actual: tutor
      subscribe(conversacion_id: canal.id)

      expect { perform :emitir, cuerpo: "" }.not_to have_broadcasted_to(canal)
      expect(Mensaje.count).to eq(0)
    end
  end
end

RSpec.describe ApplicationCable::Connection, type: :channel do
  let(:docente) { create(:usuario, :docente) }

  # Tabla 29 · WSS /cable · token en el parámetro de conexión.
  it "identifica al usuario por el token de la interfaz" do
    connect "/cable?token=#{TokenDeSesion.emitir(docente)[:token]}"

    expect(connection.usuario_actual).to eq(docente)
  end

  it "rechaza la conexión sin token" do
    expect { connect "/cable" }.to have_rejected_connection
  end

  it "rechaza la conexión con un token alterado" do
    expect { connect "/cable?token=no-es-un-token" }.to have_rejected_connection
  end

  it "rechaza la conexión de una cuenta dada de baja (CU-01 E2)" do
    baja = create(:usuario, :docente, :dado_de_baja)
    expect { connect "/cable?token=#{TokenDeSesion.emitir(baja)[:token]}" }.to have_rejected_connection
  end

  it "rechaza la conexión con la credencial provisional sin sustituir (RF-43)" do
    provisional = create(:usuario, :docente, :con_credencial_provisional)
    expect { connect "/cable?token=#{TokenDeSesion.emitir(provisional)[:token]}" }.to have_rejected_connection
  end
end
