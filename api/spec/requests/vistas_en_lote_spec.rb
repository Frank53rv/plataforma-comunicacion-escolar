# RF-35 Emisión de eventos de vista en lote · CU-10 · RN-32
# Prueba: CP-RF-35
require "rails_helper"

RSpec.describe "Emisión de eventos de vista en lote", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:curso) { create(:curso) }
  let(:docente) { create(:usuario, :docente) }
  let(:alumno) { create(:usuario, :alumno) }
  let(:tutor) { create(:usuario, :tutor) }

  before do
    create(:docente_curso, docente: docente, curso: curso)
    create(:alumno_curso, alumno: alumno, curso: curso)
    create(:tutor_alumno, tutor: tutor, alumno: alumno)
  end

  def publicar(titulo: "Aviso")
    post "/api/v1/anuncios", params: { titulo: titulo, cuerpo: "Contenido.", cursos: [ curso.id ] },
                             headers: cabecera_de(docente), as: :json
    AnuncioVersion.find_by!(anuncio_id: cuerpo["id"])
  end

  def entrega_de(version, usuario)
    EntregaAnuncio.find_by!(anuncio_version_id: version.id, destinatario_id: usuario.id)
  end

  def ver(ids, por:)
    post "/api/v1/entregas/vistas", params: { anuncio_version_ids: ids }, headers: cabecera_de(por), as: :json
  end

  # CP-RF-35 · RF-35 (Tabla 10): «El cliente debe acumular los identificadores de los
  # anuncios que ingresan al área visible y emitirlos agrupados en una sola petición.»
  # Postcondición de CU-10 (Tabla 13): «Los estados vista y leída quedan registrados con
  # marca de tiempo, de forma monótona e idempotente.» La acumulación es del cliente
  # (módulo F); esta operación recibe el lote.
  describe "CP-RF-35 · varias publicaciones en una sola petición" do
    it "registra vista_en en cada una y responde cuántas registró" do
      uno, dos, tres = publicar(titulo: "Uno"), publicar(titulo: "Dos"), publicar(titulo: "Tres")

      ver([ uno.id, dos.id, tres.id ], por: alumno)

      expect(response).to have_http_status(:ok)
      expect(cuerpo).to eq("registrada" => 3, "omitida_por_idempotencia" => 0)
      [ uno, dos, tres ].each { |version| expect(entrega_de(version, alumno).vista_en).to be_present }
    end

    it "no toca las filas de otros destinatarios de la misma publicación" do
      version = publicar

      ver([ version.id ], por: alumno)

      expect(entrega_de(version, tutor).vista_en).to be_nil
    end

    it "deja el estado actual en vista" do
      version = publicar

      ver([ version.id ], por: tutor)

      expect(entrega_de(version, tutor).estado_actual).to eq("vista")
    end

    it "completa con la misma marca el acuse que faltaba" do
      version = publicar

      travel_to(1.minute.from_now.change(usec: 0)) do
        ver([ version.id ], por: alumno)
        entrega = entrega_de(version, alumno)

        expect(entrega.entregada_en).to eq(entrega.vista_en)
        expect(entrega.vista_en).to eq(Time.current)
      end
    end
  end

  describe "idempotencia y monotonía (RN-32)" do
    it "la reemisión del lote no altera las marcas y cuenta todo como omitido" do
      uno, dos = publicar(titulo: "Uno"), publicar(titulo: "Dos")
      ver([ uno.id, dos.id ], por: alumno)
      originales = [ uno, dos ].map { |version| entrega_de(version, alumno).vista_en }

      travel_to(1.hour.from_now) { ver([ uno.id, dos.id ], por: alumno) }

      expect(cuerpo).to eq("registrada" => 0, "omitida_por_idempotencia" => 2)
      expect([ uno, dos ].map { |version| entrega_de(version, alumno).vista_en }).to eq(originales)
    end

    it "una lectura ya registrada implica la vista: el evento tardío se omite" do
      version = publicar
      entrega_de(version, alumno).registrar_estado("leida")

      ver([ version.id ], por: alumno)

      expect(cuerpo).to eq("registrada" => 0, "omitida_por_idempotencia" => 1)
    end

    it "un lote con repetidos cuenta cada publicación una sola vez" do
      version = publicar

      ver([ version.id, version.id, version.id ], por: alumno)

      expect(cuerpo).to eq("registrada" => 1, "omitida_por_idempotencia" => 0)
    end

    it "el lote mixto suma lo registrado y lo omitido" do
      nueva, ya_vista = publicar(titulo: "Nueva"), publicar(titulo: "Ya vista")
      entrega_de(ya_vista, alumno).registrar_estado("vista")

      ver([ nueva.id, ya_vista.id, SecureRandom.uuid ], por: alumno)

      expect(cuerpo).to eq("registrada" => 1, "omitida_por_idempotencia" => 2)
    end
  end

  describe "autorización" do
    it "rechaza con 403 al docente y al directivo" do
      version = publicar
      ver([ version.id ], por: docente)
      expect(response).to have_http_status(:forbidden)
      ver([ version.id ], por: create(:usuario, :directivo))
      expect(response).to have_http_status(:forbidden)
    end

    it "rechaza sin token con 401" do
      post "/api/v1/entregas/vistas", params: { anuncio_version_ids: [] }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end

    it "rechaza con 422 si falta la lista de publicaciones" do
      post "/api/v1/entregas/vistas", params: {}, headers: cabecera_de(alumno), as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
