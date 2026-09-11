# RF-05 Generación de código de activación · CU-02, CU-05 · RN-01, RN-05
# Prueba: CP-RF-05
#
# Tabla 43 · «Generación del código al registrar a una persona · Alta de un tutor ·
# Código de un solo uso, con vencimiento a siete días, asociado a esa persona.»
require "rails_helper"

RSpec.describe "Generación del código de activación", type: :model do
  let(:docente) { create(:usuario, :docente) }

  def alta_de_un_tutor
    RegistroDePersona.registrar(
      nombre: "Tutora", apellido: "Ficticia", correo: "tutora@ejemplo.test",
      rol: "tutor", registrado_por: docente
    )
  end

  describe "CP-RF-05 · alta de un tutor" do
    it "genera un código asociado a esa persona" do
      alta = alta_de_un_tutor

      expect(alta.usuario.rol).to eq("tutor")
      expect(alta.codigo_activacion.usuario).to eq(alta.usuario)
      expect(alta.usuario.reload.estado).to eq("pendiente")
    end

    it "fija el vencimiento a siete días" do
      freeze_time do
        alta = alta_de_un_tutor

        expect(alta.codigo_activacion.vence_en).to eq(Time.current + 7.days)
      end
    end

    it "es de un solo uso: nace sin usar y admite un único código vigente por persona" do
      alta = alta_de_un_tutor

      expect(alta.codigo_activacion.usado_en).to be_nil
      expect {
        CodigoActivacion.generar(usuario: alta.usuario, generado_por: docente)
      }.to raise_error(ActiveRecord::RecordNotUnique)
    end

    # RN-01 · el alta la realiza siempre otra persona con rol habilitado
    it "registra quién realizó el alta" do
      expect(alta_de_un_tutor.codigo_activacion.generado_por).to eq(docente.id)
    end
  end

  # Nota de la Tabla 40 · «la entidad almacena su derivación y no el valor, del mismo
  # modo que la contraseña, conforme a RN-06 y RNF-03».
  describe "resguardo del código" do
    it "almacena la derivación bcrypt y nunca el valor en claro" do
      alta = alta_de_un_tutor
      fila = ActiveRecord::Base.connection.select_one(
        "SELECT * FROM codigo_activacion WHERE id = '#{alta.codigo_activacion.id}'"
      )

      secreto = alta.codigo_en_claro.split("-").last
      expect(fila["codigo_hash"]).to start_with("$2a$")
      expect(fila.values.map(&:to_s).join).not_to include(secreto)
    end

    it "la representación ordinaria no incluye el código" do
      alta = alta_de_un_tutor

      expect(alta.codigo_activacion.representacion).not_to have_key(:codigo)
      expect(alta.codigo_activacion.representacion).to include(:vence_en)
    end
  end

  # D-11 · forma LLLLLLLL-SSSSSSSS
  describe "forma y localización" do
    it "tiene la forma localizador-secreto y el localizador es el comienzo del id" do
      alta = alta_de_un_tutor

      expect(alta.codigo_en_claro).to match(/\A[0-9A-F]{8}-[0-9A-HJKMNP-TV-Z]{8}\z/)
      expect(alta.codigo_en_claro[0, 8]).to eq(alta.codigo_activacion.id.delete("-")[0, 8].upcase)
    end

    it "localiza la fila a partir del código presentado" do
      alta = alta_de_un_tutor

      expect(CodigoActivacion.localizar(alta.codigo_en_claro)).to eq(alta.codigo_activacion)
    end

    it "tolera la transcripción a mano: minúsculas, espacios, sin guion y letras confundibles" do
      alta = alta_de_un_tutor
      manuscrito = alta.codigo_en_claro.downcase.delete("-").tr("01", "ol").scan(/..../).join(" ")

      expect(CodigoActivacion.localizar(manuscrito)).to eq(alta.codigo_activacion)
    end

    it "no localiza un secreto equivocado ni una forma inválida" do
      alta = alta_de_un_tutor
      localizador = alta.codigo_en_claro[0, 8]

      expect(CodigoActivacion.localizar("#{localizador}-00000000")).to be_nil
      expect(CodigoActivacion.localizar("no-es-un-codigo")).to be_nil
      expect(CodigoActivacion.localizar(nil)).to be_nil
    end
  end

  # Quality Spec · transaccionalidad
  it "no deja a la persona registrada si el código no puede generarse" do
    docente # quien hace el alta existe antes de medir
    allow(CodigoActivacion).to receive(:generar).and_raise(ActiveRecord::RecordInvalid)

    expect { alta_de_un_tutor rescue nil }.not_to change(Usuario, :count)
    expect(Usuario.find_by(correo: "tutora@ejemplo.test")).to be_nil
  end
end
