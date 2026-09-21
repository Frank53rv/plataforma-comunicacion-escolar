# RF-20 Borrado lógico de anuncios · RF-22 Consulta del historial · CU-08, CU-09
# Prueba: CP-RF-20 · CP-RF-22
require "rails_helper"

# RF-20 (Tabla 10) · «La eliminación es lógica, deja registro de autor y fecha, y conserva
# las filas de entrega asociadas.» El documento no dice que el anuncio eliminado siga en el
# historial: el historial —lo que CU-09 devuelve— sólo presenta anuncios vigentes. El
# registro de la eliminación y las entregas se conservan y siguen consultables por su detalle.
RSpec.describe "Bandeja e historial sin anuncios eliminados", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:curso) { create(:curso) }
  let(:docente) { create(:usuario, :docente) }
  let(:alumno) { create(:usuario, :alumno) }
  let(:tutor) { create(:usuario, :tutor) }
  let(:directivo) { create(:usuario, :directivo) }

  before do
    create(:docente_curso, docente: docente, curso: curso)
    create(:alumno_curso, alumno: alumno, curso: curso)
    create(:tutor_alumno, tutor: tutor, alumno: alumno)
  end

  def publicar(titulo)
    post "/api/v1/anuncios", params: { titulo: titulo, cuerpo: "Contenido.", cursos: [ curso.id ] },
                             headers: cabecera_de(docente), as: :json
    cuerpo["id"]
  end

  def titulos_para(persona)
    get "/api/v1/anuncios", headers: cabecera_de(persona), as: :json
    cuerpo["datos"].pluck("titulo")
  end

  it "un anuncio eliminado deja de aparecer en el historial de los cuatro roles" do
    publicar("Se queda")
    eliminado = publicar("Se elimina")
    delete "/api/v1/anuncios/#{eliminado}", headers: cabecera_de(docente), as: :json

    [ docente, tutor, alumno, directivo ].each do |persona|
      expect(titulos_para(persona)).to eq([ "Se queda" ])
    end
  end

  it "el total de la paginación no lo cuenta" do
    eliminado = publicar("Se elimina")
    delete "/api/v1/anuncios/#{eliminado}", headers: cabecera_de(docente), as: :json

    get "/api/v1/anuncios", headers: cabecera_de(tutor), as: :json

    expect(cuerpo).to include("total" => 0, "datos" => [])
  end

  it "conserva el registro y las entregas: el detalle sigue respondiendo, como eliminado" do
    eliminado = publicar("Se elimina")
    delete "/api/v1/anuncios/#{eliminado}", headers: cabecera_de(docente), as: :json

    get "/api/v1/anuncios/#{eliminado}", headers: cabecera_de(docente), as: :json

    expect(response).to have_http_status(:ok)
    expect(cuerpo).to include("estado" => "eliminado")
    expect(EntregaAnuncio.where(destinatario_id: tutor.id).count).to eq(1)
  end
end
