# RF-03 Alta de docentes y asignación a cursos · CU-04 · RN-01, RN-02, RN-05
# Prueba: CP-RF-03 (alta y código; la vinculación como titular se verifica con RF-15)
#
# Tabla 27 · POST /api/v1/docentes · directivo.
# Tabla 40 · petición: nombre, apellido, correo. Respuesta: recurso usuario y
# codigo_activacion con vence_en, y el código en claro una sola vez.
require "rails_helper"

RSpec.describe "Alta de docentes", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:directivo) { create(:usuario, :directivo) }
  let(:datos) { { nombre: "Docente", apellido: "Ficticio", correo: "docente.nuevo@ejemplo.test" } }

  def dar_de_alta(parametros = datos, por: directivo)
    post "/api/v1/docentes", params: parametros, headers: cabecera_de(por), as: :json
  end

  # CP-RF-03 · RF-03 (Tabla 10): «El directivo debe poder registrar docentes y
  # asignarlos a uno o varios cursos, indicando en la vinculación cuál de ellos es el
  # titular.» La vinculación es POST /cursos/{id}/docentes (RF-15); la aserción de
  # titularidad se completa en esa rama.
  describe "CP-RF-03 · alta y código" do
    it "crea al docente, en estado pendiente, y responde el recurso usuario" do
      dar_de_alta

      expect(response).to have_http_status(:created)
      expect(cuerpo["usuario"]).to include(
        "nombre" => "Docente", "apellido" => "Ficticio",
        "correo" => "docente.nuevo@ejemplo.test", "rol" => "docente", "estado" => "pendiente"
      )
      expect(cuerpo["usuario"]).not_to have_key("contrasena_hash")
    end

    it "genera su código de activación y lo devuelve en claro una sola vez" do
      freeze_time do
        dar_de_alta

        codigo = cuerpo["codigo_activacion"]
        expect(codigo["codigo"]).to match(/\A[0-9A-F]{8}-[0-9A-Z]{8}\z/)
        expect(Time.zone.parse(codigo["vence_en"])).to eq(Time.current + 7.days)
      end
    end

    it "el código devuelto activa la cuenta del docente (RF-05 → RF-06)" do
      dar_de_alta
      codigo = cuerpo["codigo_activacion"]["codigo"]

      post "/api/v1/activaciones", params: { codigo: codigo, contrasena: "clave-del-docente" }, as: :json

      expect(response).to have_http_status(:created)
      expect(cuerpo["usuario"]["rol"]).to eq("docente")
    end

    # RN-01 · nadie se auto-registra: el alta queda atribuida a quien la hizo
    it "registra al directivo como autor del alta" do
      dar_de_alta

      docente = Usuario.find(cuerpo["usuario"]["id"])
      expect(CodigoActivacion.find_by(usuario: docente).generado_por).to eq(directivo.id)
    end
  end

  describe "validaciones de forma · 422" do
    it "rechaza la petición sin alguno de los tres campos de la Tabla 40" do
      %i[nombre apellido correo].each do |faltante|
        dar_de_alta(datos.except(faltante))

        expect(response).to have_http_status(:unprocessable_content), "faltando #{faltante}"
      end
      expect(Usuario.docente.count).to eq(0)
    end

    # Tabla 21 · «Correo único». RN-04 · quien cumple dos funciones opera con dos
    # cuentas separadas, de modo que el correo no puede reutilizarse.
    it "rechaza un correo ya registrado, sin distinguir mayúsculas" do
      create(:usuario, :tutor, correo: "docente.nuevo@ejemplo.test")

      dar_de_alta(datos.merge(correo: "Docente.Nuevo@Ejemplo.test"))

      expect(response).to have_http_status(:unprocessable_content)
      expect(Usuario.docente.count).to eq(0)
    end
  end

  # RN-02 · «El directivo … da de alta a los docentes». Tabla 42 · autorización por
  # los cuatro roles.
  describe "autorización" do
    it "admite al directivo" do
      dar_de_alta

      expect(response).to have_http_status(:created)
    end

    %w[docente tutor alumno].each do |rol|
      it "rechaza a #{rol} con 403 y no crea a nadie" do
        dar_de_alta(datos, por: create(:usuario, rol: rol))

        expect(response).to have_http_status(:forbidden)
        expect(Usuario.find_by(correo: "docente.nuevo@ejemplo.test")).to be_nil
      end
    end

    it "rechaza sin token con 401" do
      post "/api/v1/docentes", params: datos, as: :json

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
