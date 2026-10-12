# RF-44 Desvinculación y baja de docente · CU-04 · RN-11, RN-13, RN-14
# Prueba: CP-RF-44
#
# Tabla 43 · «Desvinculación de docente titular sin designar reemplazo · Docente titular
# a desvincular, sin y con titular designado · Sin designación, 409; con designación,
# desvinculación exitosa y autoría conservada.»
require "rails_helper"

RSpec.describe "Desvinculación y baja de docente", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:directivo) { create(:usuario, :directivo) }
  let(:curso) { create(:curso) }
  let(:titular) { create(:docente_curso, curso: curso, es_titular: true).docente }
  let(:otro_docente) { create(:docente_curso, curso: curso, es_titular: false).docente }

  def desvincular(docente, reemplazo: nil, por: directivo)
    params = reemplazo ? { titular_reemplazo_id: reemplazo.id } : {}
    delete "/api/v1/cursos/#{curso.id}/docentes/#{docente.id}",
           params: params, headers: cabecera_de(por), as: :json
  end

  def dar_de_baja(docente, por: directivo)
    delete "/api/v1/docentes/#{docente.id}", headers: cabecera_de(por), as: :json
  end

  describe "CP-RF-44" do
    before { otro_docente }

    it "sin designación de reemplazo, rechaza con 409 y RN-13 y el curso conserva su titular" do
      desvincular(titular)

      expect(response).to have_http_status(:conflict)
      expect(cuerpo["regla"]).to eq("RN-13")
      expect(curso.vinculaciones_docentes.vigentes.titulares.sole.usuario_id).to eq(titular.id)
    end

    it "con designación, desvincula, deja un único titular y conserva la autoría" do
      # Autoría: un código que el titular generó para un alumno de su curso (RN-14)
      alta = RegistroDePersona.registrar(nombre: "A", apellido: "B", correo: "a@ejemplo.test",
                                         rol: "alumno", registrado_por: titular)

      desvincular(titular, reemplazo: otro_docente)

      expect(response).to have_http_status(:ok)
      expect(cuerpo).to include("usuario_id" => titular.id, "es_titular" => true)
      expect(cuerpo["vigente_hasta"]).to eq(Time.current.to_date.iso8601)

      titulares = curso.vinculaciones_docentes.vigentes.titulares
      expect(titulares.sole.usuario_id).to eq(otro_docente.id)

      # autoría e historial conservados
      expect(Usuario.find(titular.id).estado).to eq("activo")
      expect(DocenteCurso.where(usuario_id: titular.id, curso_id: curso.id).count).to eq(1)
      expect(alta.codigo_activacion.reload.generado_por).to eq(titular.id)
    end
  end

  # El reemplazo asume la titularidad desde hoy
  it "conserva en el historial desde cuándo el reemplazo es titular" do
    otro_docente
    desvincular(titular, reemplazo: otro_docente)

    del_reemplazo = DocenteCurso.where(usuario_id: otro_docente.id, curso_id: curso.id).order(:vigente_desde)
    expect(del_reemplazo.map { |v| [ v.es_titular, v.vigente_hasta.nil? ] }).to eq([ [ false, false ], [ true, true ] ])
  end

  describe "rechazos de la designación" do
    it "rechaza con 422 un reemplazo no vinculado al curso" do
      desvincular(titular, reemplazo: create(:usuario, :docente))

      expect(response).to have_http_status(:unprocessable_content)
      expect(curso.vinculaciones_docentes.vigentes.titulares.sole.usuario_id).to eq(titular.id)
    end

    it "rechaza con 422 que el titular se designe a sí mismo" do
      desvincular(titular, reemplazo: titular)

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "rechaza con 422 un reemplazo dado de baja" do
      otro_docente.update!(estado: "dado_de_baja")

      desvincular(titular, reemplazo: otro_docente)

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  it "desvincula a un docente no titular sin exigir reemplazo" do
    desvincular(otro_docente)

    expect(response).to have_http_status(:ok)
    expect(cuerpo["vigente_hasta"]).to be_present
    expect(curso.vinculaciones_docentes.vigentes.pluck(:usuario_id)).not_to include(otro_docente.id)
  end

  it "responde 404 si el docente no está vinculado al curso" do
    desvincular(create(:usuario, :docente))

    expect(response).to have_http_status(:not_found)
  end

  describe "baja lógica del docente" do
    it "rechaza con 409 y RN-13 la baja del docente que conserva vinculaciones vigentes" do
      dar_de_baja(titular)

      expect(response).to have_http_status(:conflict)
      expect(cuerpo["regla"]).to eq("RN-13")
      expect(titular.reload.estado).to eq("activo")
    end

    it "da de baja al docente ya desvinculado: acceso revocado, autoría conservada" do
      otro_docente
      desvincular(titular, reemplazo: otro_docente)

      dar_de_baja(titular)

      expect(response).to have_http_status(:ok)
      expect(cuerpo).to include("id" => titular.id, "estado" => "dado_de_baja")
      delete "/api/v1/sesiones", headers: cabecera_de(titular)
      expect(response).to have_http_status(:unauthorized)
      expect(DocenteCurso.where(usuario_id: titular.id).count).to eq(1)
    end

    it "responde 404 si el identificador no es de un docente" do
      dar_de_baja(create(:usuario, :tutor))

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "autorización · RN-13" do
    %w[docente tutor alumno].each do |rol|
      it "rechaza a #{rol} con 403 en ambas operaciones" do
        quien = create(:usuario, rol: rol)

        desvincular(otro_docente, por: quien)
        expect(response).to have_http_status(:forbidden)
        dar_de_baja(otro_docente, por: quien)
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
