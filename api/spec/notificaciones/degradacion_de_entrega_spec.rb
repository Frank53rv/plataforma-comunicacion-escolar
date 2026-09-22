# RF-37 Degradación ante fallo de entrega · CU-14 · RNF-11, RNF-12
# Prueba: CP-RF-37
require "rails_helper"

RSpec.describe "Degradación ante fallo de entrega", type: :model do
  include ActiveJob::TestHelper

  # La cola de la aplicación es Solid Queue; las pruebas usan el adaptador de prueba, que
  # deja los trabajos a la vista sin ejecutarlos ni tocar la cola real.
  around do |ejemplo|
    original = ActiveJob::Base.queue_adapter
    ActiveJob::Base.queue_adapter = :test
    ejemplo.run
  ensure
    ActiveJob::Base.queue_adapter = original
  end

  let(:curso) { create(:curso) }
  let(:docente) { create(:usuario, :docente) }
  let(:tutor) { create(:usuario, :tutor) }
  let(:version) do
    anuncio = create(:anuncio, autor: docente)
    create(:anuncio_version, anuncio: anuncio)
  end
  let(:entrega) { create(:entrega_anuncio, anuncio_version: version, destinatario: tutor, canal: "aplicacion") }

  # Cliente doble: devuelve resultados preparados, uno por llamada.
  def cliente_que_responde(*estados)
    resultados = estados.map { |estado, codigo| ClienteFcm::Resultado.new(estado: estado, codigo: codigo || "x") }
    cliente = instance_double(ClienteFcm)
    allow(cliente).to receive(:enviar) { resultados.length > 1 ? resultados.shift : resultados.first }
    allow(ClienteFcm).to receive(:desde_el_entorno).and_return(cliente)
    cliente
  end

  def suscribir(usuario = tutor, **atributos)
    create(:suscripcion_push, usuario: usuario, **atributos)
  end

  # RF-37 (Tabla 10): «Ante indisponibilidad del servicio push, ausencia de acuse del
  # cliente o falta de soporte del navegador, el sistema debe entregar el aviso dentro de
  # la aplicación y registrar la causa, sin reintentar de manera indefinida ante
  # credenciales inválidas.» Postcondición de CU-14 (Tabla 13): «La entrega queda
  # registrada como entregada por acuse del cliente, o con causa de fallo y degradación a
  # aviso en la aplicación.»
  describe "falta de soporte del navegador" do
    it "sin ninguna suscripción vigente, la fila queda en la aplicación con su causa y en la bitácora" do
      EnvioDeAviso.para_entrega(entrega, titulo: "T", cuerpo: "C")

      expect(entrega.reload).to have_attributes(canal: "aplicacion", causa_fallo: "falta_de_soporte_del_navegador")
      registro = BitacoraEnvio.find_by!(entrega_anuncio_id: entrega.id)
      expect(registro).to have_attributes(causa: "falta_de_soporte_del_navegador", codigo_proveedor: "sin_suscripcion",
                                          suscripcion_id: nil)
    end

    it "una suscripción inválida no cuenta como destino" do
      create(:suscripcion_push, :invalida, usuario: tutor)

      EnvioDeAviso.para_entrega(entrega, titulo: "T", cuerpo: "C")

      expect(entrega.reload.causa_fallo).to eq("falta_de_soporte_del_navegador")
    end
  end

  describe "envío aceptado" do
    it "deja la fila en canal push, sin causa, y programa la verificación del acuse" do
      cliente = cliente_que_responde([ :aceptado, "200" ])
      suscribir

      freeze_time do
        expect { EnvioDeAviso.para_entrega(entrega, titulo: "T", cuerpo: "C") }
          .to have_enqueued_job(VerificacionDeAcuseJob).with(entrega.id).at(PoliticaDeEnvio::ESPERA_DE_ACUSE.from_now)
      end

      expect(cliente).to have_received(:enviar).with(token: SuscripcionPush.last.token, titulo: "T", cuerpo: "C")
      expect(entrega.reload).to have_attributes(canal: "push", causa_fallo: nil)
      expect(BitacoraEnvio.count).to eq(0)
    end

    it "basta que una de las suscripciones acepte" do
      cliente_que_responde([ :credencial_invalida, "UNREGISTERED" ], [ :aceptado, "200" ])
      viejo = suscribir
      suscribir

      EnvioDeAviso.para_entrega(entrega, titulo: "T", cuerpo: "C")

      expect(entrega.reload.canal).to eq("push")
      expect(viejo.reload.estado).to eq("invalida")
    end
  end

  describe "credencial inválida (RNF-12): se cierra sin reintentar" do
    it "invalida la suscripción, degrada con la causa y registra el código del proveedor" do
      cliente_que_responde([ :credencial_invalida, "UNREGISTERED" ])
      suscripcion = suscribir

      expect { EnvioDeAviso.para_entrega(entrega, titulo: "T", cuerpo: "C") }
        .not_to have_enqueued_job(EnvioDeAvisoJob)

      expect(suscripcion.reload).to have_attributes(estado: "invalida")
      expect(suscripcion.invalidada_en).to be_present
      expect(entrega.reload).to have_attributes(canal: "aplicacion", causa_fallo: "credencial_invalida")
      expect(BitacoraEnvio.find_by!(entrega_anuncio_id: entrega.id)).to have_attributes(
        causa: "credencial_invalida", codigo_proveedor: "UNREGISTERED", suscripcion_id: suscripcion.id
      )
    end
  end

  describe "fallo transitorio (RNF-12): se reintenta desde la cola" do
    it "el servicio no disponible lanza el error transitorio, para que la cola reintente" do
      cliente_que_responde([ :transitorio, "503" ])
      suscribir

      expect { EnvioDeAviso.para_entrega(entrega, titulo: "T", cuerpo: "C") }
        .to raise_error(EnvioDeAviso::ErrorTransitorio)
      expect(entrega.reload).to have_attributes(canal: "aplicacion", causa_fallo: nil)
    end

    it "el trabajo reintenta a los 1, 5 y 15 minutos" do
      expect(PoliticaDeEnvio::REINTENTOS).to eq([ 1.minute, 5.minutes, 15.minutes ])
    end

    it "agotados los reintentos, degrada con la indisponibilidad del servicio y lo registra" do
      cliente_que_responde([ :transitorio, "503" ])
      suscripcion = suscribir

      perform_enqueued_jobs { NotificacionAnuncioJob.perform_later(entrega.id) }
      # 1 intento inicial + 3 reintentos, cada uno diferido: se ejecutan todos.
      travel_to(1.hour.from_now) { perform_enqueued_jobs }
      travel_to(2.hours.from_now) { perform_enqueued_jobs }
      travel_to(3.hours.from_now) { perform_enqueued_jobs }

      expect(entrega.reload).to have_attributes(canal: "aplicacion", causa_fallo: "indisponibilidad_del_servicio_push")
      expect(suscripcion.reload.estado).to eq("vigente")
      expect(BitacoraEnvio.find_by!(entrega_anuncio_id: entrega.id)).to have_attributes(
        causa: "indisponibilidad_del_servicio_push", codigo_proveedor: "503"
      )
    end
  end

  describe "ausencia de acuse del cliente" do
    it "sin acuse a los 15 minutos, la fila vuelve a la aplicación con su causa" do
      entrega.update!(canal: "push")
      suscripcion = suscribir

      VerificacionDeAcuseJob.perform_now(entrega.id)

      expect(entrega.reload).to have_attributes(canal: "aplicacion", causa_fallo: "ausencia_de_acuse_del_cliente")
      expect(BitacoraEnvio.find_by!(entrega_anuncio_id: entrega.id)).to have_attributes(
        causa: "ausencia_de_acuse_del_cliente", codigo_proveedor: "sin_acuse"
      )
      expect(suscripcion.reload.estado).to eq("vigente")
    end

    it "con el acuse recibido, no cambia nada" do
      entrega.update!(canal: "push", enviada_en: 1.hour.ago, entregada_en: 30.minutes.ago)

      VerificacionDeAcuseJob.perform_now(entrega.id)

      expect(entrega.reload).to have_attributes(canal: "push", causa_fallo: nil)
      expect(BitacoraEnvio.count).to eq(0)
    end

    it "la espera del acuse es de 15 minutos" do
      expect(PoliticaDeEnvio::ESPERA_DE_ACUSE).to eq(15.minutes)
    end
  end

  describe "RNF-11 · la indisponibilidad del servicio no impide operar" do
    it "un error inesperado del cliente no propaga: cuenta como servicio no disponible" do
      cliente = instance_double(ClienteFcm)
      allow(cliente).to receive(:enviar).and_raise(RuntimeError, "boom")
      allow(ClienteFcm).to receive(:desde_el_entorno).and_return(cliente)
      suscribir

      expect { EnvioDeAviso.para_entrega(entrega, titulo: "T", cuerpo: "C") }
        .to raise_error(EnvioDeAviso::ErrorTransitorio)
    end
  end
end

RSpec.describe "Purga de la bitácora de envío", type: :model do
  # RNF-07 (Tabla 11): «La bitácora técnica de fallos de envío —causa, código de error del
  # proveedor y token invalidado—, doce meses.»
  it "borra los registros anteriores al plazo y conserva los demás" do
    vieja = create(:bitacora_envio, ocurrido_en: 13.months.ago)
    reciente = create(:bitacora_envio, ocurrido_en: 11.months.ago)

    expect(BitacoraEnvio.purgar).to eq(1)

    expect(BitacoraEnvio.exists?(vieja.id)).to be(false)
    expect(BitacoraEnvio.exists?(reciente.id)).to be(true)
  end

  it "toma el plazo de RETENCION_BITACORA_MESES (Tabla 30)" do
    create(:bitacora_envio, ocurrido_en: 4.months.ago)
    stub_const("ENV", ENV.to_hash.merge("RETENCION_BITACORA_MESES" => "3"))

    expect(BitacoraEnvio.purgar).to eq(1)
  end

  it "el trabajo recurrente la ejecuta" do
    create(:bitacora_envio, ocurrido_en: 2.years.ago)

    PurgaDeBitacoraJob.perform_now

    expect(BitacoraEnvio.count).to eq(0)
  end
end
