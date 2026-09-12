# RF-07 Regeneración de código de activación · CU-04, CU-05 · RN-07, RN-08
# Prueba: CP-RF-07
#
# Tabla 27 · POST /api/v1/usuarios/{id}/codigos-activacion · «Directivo (docentes),
# docente (alumnos y tutores)».
# Tabla 40 · sin cuerpo → codigo_activacion con vence_en y el código en claro.
require "rails_helper"

RSpec.describe "Regeneración del código de activación", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:directivo) { create(:usuario, :directivo) }
  let(:curso) { create(:curso) }
  let(:docente_del_curso) { create(:docente_curso, curso: curso).docente }
  let(:docente_ajeno) { create(:docente_curso).docente }

  # Un alumno pendiente del curso, con el código que le generó el alta (RF-05).
  let!(:alta_alumno) do
    RegistroDePersona.registrar(nombre: "Alumno", apellido: "Ficticio",
                                correo: "alumno@ejemplo.test", rol: "alumno",
                                registrado_por: docente_del_curso)
  end
  let(:alumno) { alta_alumno.usuario }

  before { create(:alumno_curso, alumno: alumno, curso: curso) }

  def regenerar(persona, por:)
    post "/api/v1/usuarios/#{persona.id}/codigos-activacion", headers: cabecera_de(por), as: :json
  end

  def activar(codigo)
    post "/api/v1/activaciones", params: { codigo: codigo, contrasena: "clave-propia-123" }, as: :json
  end

  # CP-RF-07 · «Docente del curso; luego docente ajeno al curso → Código anterior
  # invalidado y nuevo vigente. El docente ajeno obtiene 403.»
  describe "CP-RF-07" do
    it "el docente del curso regenera: el anterior queda invalidado y el nuevo vigente" do
      regenerar(alumno, por: docente_del_curso)

      expect(response).to have_http_status(:created)
      expect(alta_alumno.codigo_activacion.reload.usado_en).to be_present
      nuevo = CodigoActivacion.localizar(cuerpo["codigo"])
      expect(nuevo).to be_vigente
      expect(nuevo.generado_por).to eq(docente_del_curso.id)
    end

    it "el docente ajeno al curso obtiene 403 y el código anterior sigue vigente" do
      regenerar(alumno, por: docente_ajeno)

      expect(response).to have_http_status(:forbidden)
      expect(alta_alumno.codigo_activacion.reload).to be_vigente
      expect(CodigoActivacion.where(usuario: alumno).count).to eq(1)
    end
  end

  it "el código nuevo activa la cuenta y el anterior ya no (CU-02)" do
    regenerar(alumno, por: docente_del_curso)
    nuevo = cuerpo["codigo"]

    activar(alta_alumno.codigo_en_claro)
    expect(response).to have_http_status(:gone)

    activar(nuevo)
    expect(response).to have_http_status(:created)
  end

  # RF-07 · «cuando el anterior venció o se perdió»
  it "regenera también cuando el código anterior ya había vencido" do
    travel_to(Time.current + 8.days) do
      regenerar(alumno, por: docente_del_curso)

      expect(response).to have_http_status(:created)
      expect(Time.zone.parse(cuerpo["vence_en"])).to be_within(1.second).of(Time.current + 7.days)
    end
  end

  it "responde la forma de la Tabla 40, con el código en claro" do
    regenerar(alumno, por: docente_del_curso)

    expect(cuerpo.keys).to contain_exactly("vence_en", "codigo")
    expect(CodigoActivacion.localizar(cuerpo["codigo"]).usuario_id).to eq(alumno.id)
    expect(cuerpo["codigo"]).to match(/\A[0-9A-F]{8}-[0-9A-Z]{8}\z/)
  end

  # RN-07 · la cadena completa
  describe "la cadena de RN-07" do
    it "el docente regenera el de un tutor de un alumno de su curso" do
      tutor = create(:usuario, :tutor, :pendiente)
      create(:tutor_alumno, tutor: tutor, alumno: alumno)

      regenerar(tutor, por: docente_del_curso)

      expect(response).to have_http_status(:created)
    end

    it "el docente no regenera el de un tutor de otro curso" do
      tutor = create(:usuario, :tutor, :pendiente)
      create(:tutor_alumno, tutor: tutor, alumno: create(:alumno_curso).alumno)

      regenerar(tutor, por: docente_del_curso)

      expect(response).to have_http_status(:forbidden)
    end

    it "el directivo regenera el de un docente" do
      docente_pendiente = create(:usuario, :docente, :pendiente)

      regenerar(docente_pendiente, por: directivo)

      expect(response).to have_http_status(:created)
    end

    it "el directivo no regenera el de un alumno: esa atribución es del docente" do
      regenerar(alumno, por: directivo)

      expect(response).to have_http_status(:forbidden)
    end

    it "el docente no regenera el de otro docente" do
      regenerar(create(:usuario, :docente, :pendiente), por: docente_del_curso)

      expect(response).to have_http_status(:forbidden)
    end

    # RN-08 · la cuenta directiva se repone por variable de entorno
    it "nadie regenera el de la cuenta directiva" do
      otro_directivo = create(:usuario, :directivo, :pendiente)

      regenerar(otro_directivo, por: directivo)

      expect(response).to have_http_status(:forbidden)
    end

    it "el docente desvinculado del curso pierde la atribución" do
      DocenteCurso.find_by(usuario_id: docente_del_curso.id).update!(vigente_hasta: Time.current.to_date)

      regenerar(alumno, por: docente_del_curso)

      expect(response).to have_http_status(:forbidden)
    end
  end

  # D-12 · sólo cuentas pendientes
  describe "estado de la cuenta · D-12" do
    it "rechaza con 422 la cuenta ya activa" do
      alumno.update!(estado: "activo", contrasena: "clave-123")

      regenerar(alumno, por: docente_del_curso)

      expect(response).to have_http_status(:unprocessable_content)
      expect(CodigoActivacion.where(usuario: alumno).count).to eq(1)
    end

    it "rechaza con 422 la cuenta dada de baja" do
      alumno.update!(estado: "dado_de_baja")

      regenerar(alumno, por: docente_del_curso)

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "el docente ajeno recibe 403 aunque la cuenta esté activa: no averigua su estado" do
      alumno.update!(estado: "activo", contrasena: "clave-123")

      regenerar(alumno, por: docente_ajeno)

      expect(response).to have_http_status(:forbidden)
    end
  end

  it "responde 404 si la persona no existe" do
    post "/api/v1/usuarios/#{SecureRandom.uuid}/codigos-activacion",
         headers: cabecera_de(docente_del_curso), as: :json

    expect(response).to have_http_status(:not_found)
  end
end
