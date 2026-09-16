# RF-20 Borrado lógico de anuncios · CU-08 · RN-14, RN-20
# Prueba: CP-RF-20
require "rails_helper"

RSpec.describe "Borrado lógico de anuncios", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:autor) { create(:usuario, :docente) }
  let(:anuncio) { create(:anuncio, autor: autor) }
  let!(:version) { create(:anuncio_version, anuncio: anuncio) }
  let!(:entrega) { create(:entrega_anuncio, anuncio_version: version) }

  def eliminar(anuncio_id, por: autor)
    delete "/api/v1/anuncios/#{anuncio_id}", headers: cabecera_de(por), as: :json
  end

  # CP-RF-20 · «Borrado lógico de anuncio propio y de anuncio ajeno. Anuncio propio;
  # luego de otro docente. El propio se elimina con autor y fecha, conservando las
  # filas de entrega; el ajeno responde 403.»
  describe "CP-RF-20 · borrado" do
    it "elimina el anuncio propio, con autor y fecha, y conserva las filas de entrega" do
      eliminar(anuncio.id)

      expect(response).to have_http_status(:ok)
      expect(cuerpo["estado"]).to eq("eliminado")
      expect(cuerpo["eliminado_por"]).to eq(autor.id)
      expect(cuerpo["eliminado_en"]).to be_present
      expect(EntregaAnuncio.exists?(entrega.id)).to be(true)
    end

    it "rechaza con 403 la eliminación de un anuncio del que no es autor (CU-08 E1)" do
      otro_docente = create(:usuario, :docente)

      eliminar(anuncio.id, por: otro_docente)

      expect(response).to have_http_status(:forbidden)
      expect(anuncio.reload.estado_publicado?).to be(true)
    end

    it "es idempotente: eliminar un anuncio ya eliminado no reescribe autor ni fecha" do
      eliminar(anuncio.id)
      primera_fecha = cuerpo["eliminado_en"]

      eliminar(anuncio.id)

      expect(response).to have_http_status(:ok)
      expect(cuerpo["eliminado_en"]).to eq(primera_fecha)
    end

    it "responde 404 si el anuncio no existe" do
      eliminar(SecureRandom.uuid)

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "autorización" do
    it "admite al docente autor" do
      eliminar(anuncio.id)
      expect(response).to have_http_status(:ok)
    end

    %w[directivo tutor alumno].each do |rol|
      it "rechaza a #{rol} con 403" do
        eliminar(anuncio.id, por: create(:usuario, rol: rol))
        expect(response).to have_http_status(:forbidden)
      end
    end

    it "rechaza sin token con 401" do
      delete "/api/v1/anuncios/#{anuncio.id}", as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
