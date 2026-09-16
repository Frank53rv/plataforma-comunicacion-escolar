# RF-21 Resolución de destinatarios · CU-06, CU-07 · RN-19
# Prueba: CP-RF-21
#
# CU-07 flujo alternativo A · mientras RF-19 (Should have) no se construya, «editar» un
# anuncio es esta misma secuencia: DELETE (CU-08 · RF-20) y POST nuevo (CU-06 · RF-17).
# No hay ruta PATCH que probar acá: lo que RF-21 exige —resolver en cada publicación
# efectiva, inicial o de reemplazo— ya lo cubren esas dos operaciones.
require "rails_helper"

RSpec.describe "Resolución de destinatarios", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:docente) { create(:usuario, :docente) }
  let(:curso) { create(:curso) }

  before { create(:docente_curso, docente: docente, curso: curso) }

  def publicar(cursos:, por: docente)
    post "/api/v1/anuncios",
         params: { titulo: "Aviso", cuerpo: "Contenido.", cursos: cursos },
         headers: cabecera_de(por), as: :json
  end

  # CP-RF-21 · «Resolución de destinatarios en la publicación efectiva. Alumno
  # incorporado al curso con posterioridad a la publicación. El alumno incorporado
  # después no recibe la publicación anterior.»
  describe "CP-RF-21 · resolución inicial, no en la redacción" do
    it "no incluye al alumno vinculado después de la publicación" do
      alumno_previo = create(:usuario, :alumno)
      create(:alumno_curso, alumno: alumno_previo, curso: curso)

      publicar(cursos: [ curso.id ])
      anuncio = Anuncio.find(cuerpo["id"])

      alumno_posterior = create(:usuario, :alumno)
      create(:alumno_curso, alumno: alumno_posterior, curso: curso)

      destinatarios = anuncio.version_vigente.entregas.pluck(:destinatario_id)
      expect(destinatarios).to contain_exactly(alumno_previo.id)
      expect(destinatarios).not_to include(alumno_posterior.id)
    end
  end

  # CU-07 flujo alternativo A · «de reemplazo»: eliminar y publicar de nuevo resuelve
  # los destinatarios otra vez, sobre las vinculaciones vigentes en ese momento.
  describe "resolución de reemplazo (CU-07 A) · eliminar y publicar de nuevo" do
    it "resuelve de nuevo, con el alumno incorporado entre ambas publicaciones" do
      alumno_original = create(:usuario, :alumno)
      create(:alumno_curso, alumno: alumno_original, curso: curso)

      publicar(cursos: [ curso.id ])
      primer_anuncio_id = cuerpo["id"]
      delete "/api/v1/anuncios/#{primer_anuncio_id}", headers: cabecera_de(docente), as: :json
      expect(response).to have_http_status(:ok)

      alumno_nuevo = create(:usuario, :alumno)
      create(:alumno_curso, alumno: alumno_nuevo, curso: curso)

      publicar(cursos: [ curso.id ])
      segundo_anuncio = Anuncio.find(cuerpo["id"])

      destinatarios = segundo_anuncio.version_vigente.entregas.pluck(:destinatario_id)
      expect(destinatarios).to contain_exactly(alumno_original.id, alumno_nuevo.id)
      expect(Anuncio.find(primer_anuncio_id).estado_eliminado?).to be(true)
    end
  end
end
