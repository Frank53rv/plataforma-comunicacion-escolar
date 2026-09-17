# RF-25 Canal grupal del curso · CU-12 · RN-23
# Prueba: CP-RF-25
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
