# RF-34 Registro de estados de notificación · CU-10, CU-14 · RN-32
# Prueba: CP-RF-34
require "rails_helper"

RSpec.describe "Registro de estados de notificación", type: :request do
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

  def acusar(ids, por:)
    post "/api/v1/entregas/acuses", params: { anuncio_version_ids: ids }, headers: cabecera_de(por), as: :json
  end

  # CP-RF-34 · RF-34 (Tabla 10): «El sistema debe registrar, por persona y por publicación,
  # los estados enviada, entregada, vista y leída, cada uno con marca de tiempo. Los
  # estados no retroceden.» Postcondición de CU-14 (Tabla 13): «La entrega queda
  # registrada como entregada por acuse del cliente…»
  describe "CP-RF-34 · el acuse del cliente registra la entrega" do
    it "el tutor y el alumno registran entregada_en de su propia fila, y no la de otro" do
      version = publicar

      acusar([ version.id ], por: alumno)

      expect(response).to have_http_status(:ok)
      expect(cuerpo).to eq("registrada" => 1, "omitida_por_idempotencia" => 0)
      expect(entrega_de(version, alumno).entregada_en).to be_present
      expect(entrega_de(version, tutor).entregada_en).to be_nil
    end

    it "registra la marca en el momento del acuse, en tiempo universal" do
      version = publicar

      travel_to(1.minute.from_now.change(usec: 0)) do
        acusar([ version.id ], por: tutor)
        expect(entrega_de(version, tutor).entregada_en).to eq(Time.current)
      end
    end

    it "el estado enviada queda registrado al publicar, con su marca" do
      version = publicar

      expect(entrega_de(version, alumno).enviada_en).to be_present
    end

    it "acusa varias publicaciones en una sola petición" do
      primera, segunda = publicar(titulo: "Uno"), publicar(titulo: "Dos")

      acusar([ primera.id, segunda.id ], por: alumno)

      expect(cuerpo).to eq("registrada" => 2, "omitida_por_idempotencia" => 0)
    end

    it "cuenta como omitida la publicación que no le corresponde" do
      version = publicar
      ajeno = create(:usuario, :alumno)

      acusar([ version.id ], por: ajeno)

      expect(cuerpo).to eq("registrada" => 0, "omitida_por_idempotencia" => 1)
    end
  end

  describe "los estados no retroceden (RN-32)" do
    it "un acuse tardío no altera una entrega que ya está leída" do
      version = publicar
      entrega = entrega_de(version, alumno)
      leida = 1.minute.from_now.change(usec: 0)
      entrega.update!(entregada_en: leida, vista_en: leida, leida_en: leida)

      acusar([ version.id ], por: alumno)

      expect(cuerpo).to eq("registrada" => 0, "omitida_por_idempotencia" => 1)
      expect(entrega.reload.entregada_en).to eq(leida)
    end
  end

  describe "autorización" do
    it "rechaza con 403 al docente y al directivo" do
      version = publicar
      acusar([ version.id ], por: docente)
      expect(response).to have_http_status(:forbidden)
      acusar([ version.id ], por: create(:usuario, :directivo))
      expect(response).to have_http_status(:forbidden)
    end

    it "rechaza sin token con 401" do
      post "/api/v1/entregas/acuses", params: { anuncio_version_ids: [] }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end

    it "rechaza con 422 si falta la lista de publicaciones" do
      post "/api/v1/entregas/acuses", params: {}, headers: cabecera_de(alumno), as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "el estado actual (Figura 12)" do
    it "es el más avanzado de los registrados" do
      version = publicar
      entrega = entrega_de(version, alumno)
      expect(entrega.estado_actual).to eq("enviada")

      entrega.registrar_estado("entregada")
      expect(entrega.estado_actual).to eq("entregada")

      entrega.registrar_estado("leida")
      expect(entrega.estado_actual).to eq("leida")
    end
  end

  describe "registrar un estado completa los anteriores que falten (RN-32)" do
    it "una lectura sin vista ni acuse deja las tres marcas iguales" do
      version = publicar
      entrega = entrega_de(version, alumno)

      travel_to(1.minute.from_now.change(usec: 0)) do
        entrega.registrar_estado("leida")
        entrega.reload

        expect([ entrega.entregada_en, entrega.vista_en, entrega.leida_en ].uniq).to eq([ Time.current ])
      end
    end

    it "la marca del evento nunca precede al envío, aunque el reloj de quien la emite atrase" do
      version = publicar
      entrega = entrega_de(version, alumno)

      travel_to(1.hour.ago) { entrega.registrar_estado("entregada") }

      expect(entrega.reload.entregada_en).to eq(entrega.enviada_en)
    end

    it "un estado menor que llega después no altera las marcas ya registradas" do
      version = publicar
      entrega = entrega_de(version, alumno)
      entrega.registrar_estado("leida")
      original = entrega.reload.entregada_en

      resultado = travel_to(1.hour.from_now) { entrega.registrar_estado("entregada") }

      expect(resultado).to eq(:omitida)
      expect(entrega.reload.entregada_en).to eq(original)
    end
  end
end
