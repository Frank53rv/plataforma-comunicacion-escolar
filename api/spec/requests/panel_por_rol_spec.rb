# RF-40 Paneles diferenciados por rol · CU-09 · RN-04, RN-15
# Prueba: CP-RF-40
require "rails_helper"

# RF-40 (Tabla 10) · «El cliente debe presentar paneles con las funciones correspondientes
# al rol de la persona autenticada, sin exponer opciones ajenas a él.»
# Tabla 29 · GET /paneles/me → «rol, nombre, opciones habilitadas y cantidad de anuncios sin
# leer». Tabla 18 · los cuatro roles. RNF-21 · la decisión de qué opciones corresponden es de
# la interfaz de programación: el cliente sólo dibuja lo que este panel le declara.
RSpec.describe "Panel por rol", type: :request do
  def cuerpo = JSON.parse(response.body)

  def panel_de(usuario)
    get "/api/v1/paneles/me", headers: cabecera_de(usuario), as: :json
    cuerpo
  end

  let(:curso) { create(:curso, nombre: "Primero A") }
  let(:docente) { create(:usuario, :docente, nombre: "Ana") }
  let(:alumno) { create(:usuario, :alumno, nombre: "Luis") }
  let(:tutor) { create(:usuario, :tutor, nombre: "Marta") }
  let(:directivo) { create(:usuario, :directivo, nombre: "Rosa") }

  before do
    create(:docente_curso, docente: docente, curso: curso)
    create(:alumno_curso, alumno: alumno, curso: curso)
    create(:tutor_alumno, tutor: tutor, alumno: alumno)
  end

  # CP-RF-40 · cada rol recibe las funciones que la Tabla 18 le autoriza, y ninguna más.
  describe "CP-RF-40 · opciones habilitadas por rol" do
    it "el directivo administra la estructura y supervisa, y no publica ni conversa" do
      expect(panel_de(directivo)).to include(
        "rol" => "directivo", "nombre" => "Rosa",
        "opciones_habilitadas" => %w[anuncios preferencias supervision anios_lectivos cursos docentes alumnos]
      )
    end

    it "el docente publica, consulta constancias, conversa y administra a sus alumnos" do
      expect(panel_de(docente)).to include(
        "rol" => "docente", "nombre" => "Ana",
        "opciones_habilitadas" => %w[anuncios publicar_anuncio constancias conversaciones preferencias cursos alumnos
                                     altas_de_alumnos_y_tutores]
      )
    end

    it "el tutor consulta anuncios, conversa y configura sus preferencias" do
      expect(panel_de(tutor)).to include(
        "rol" => "tutor", "nombre" => "Marta",
        "opciones_habilitadas" => %w[anuncios conversaciones preferencias]
      )
    end

    it "el alumno sólo consulta anuncios y configura sus preferencias" do
      expect(panel_de(alumno)).to include(
        "rol" => "alumno", "nombre" => "Luis", "opciones_habilitadas" => %w[anuncios preferencias]
      )
    end

    it "la bandeja de anuncios es la primera opción de los cuatro (RF-39)" do
      primeras = [ directivo, docente, tutor, alumno ].map { |persona| panel_de(persona)["opciones_habilitadas"].first }

      expect(primeras).to eq(%w[anuncios] * 4)
    end
  end

  # La opción se declara sólo si la persona puede usarla: una sección que la interfaz sabe
  # vacía es una opción ajena a ella.
  describe "sin conversaciones a las que acceder" do
    it "el docente sin cursos no ve la conversación" do
      sin_curso = create(:usuario, :docente)

      expect(panel_de(sin_curso)["opciones_habilitadas"]).not_to include("conversaciones")
    end

    it "el tutor sin alumnos vinculados no ve la conversación" do
      sin_alumnos = create(:usuario, :tutor)

      expect(panel_de(sin_alumnos)["opciones_habilitadas"]).not_to include("conversaciones")
    end

    it "el alumno no la ve: el canal del curso es de docentes y tutores" do
      expect(panel_de(alumno)["opciones_habilitadas"]).not_to include("conversaciones")
    end
  end

  describe "cursos de la persona · filtro del historial (RF-22)" do
    let!(:otro_curso) { create(:curso, nombre: "Segundo B") }

    it "el docente recibe los que dicta" do
      expect(panel_de(docente)["cursos"]).to eq([ { "id" => curso.id, "nombre" => "Primero A" } ])
    end

    it "el tutor recibe los de sus alumnos" do
      expect(panel_de(tutor)["cursos"]).to eq([ { "id" => curso.id, "nombre" => "Primero A" } ])
    end

    it "el alumno recibe el suyo" do
      expect(panel_de(alumno)["cursos"]).to eq([ { "id" => curso.id, "nombre" => "Primero A" } ])
    end

    it "el directivo recibe los del año lectivo vigente, por nombre" do
      expect(panel_de(directivo)["cursos"].pluck("nombre")).to eq([ "Primero A", "Segundo B" ])
    end

    it "no incluye los cursos a los que la persona ya no está vinculada" do
      AlumnoCurso.find_by!(usuario_id: alumno.id).update!(vigente_hasta: Time.current.to_date)

      expect(panel_de(alumno)["cursos"]).to be_empty
    end
  end

  describe "anuncios sin leer" do
    def publicar(titulo)
      post "/api/v1/anuncios", params: { titulo: titulo, cuerpo: "Contenido.", cursos: [ curso.id ] },
                               headers: cabecera_de(docente), as: :json
      cuerpo.dig("anuncio_version", "id")
    end

    it "cuenta las publicaciones dirigidas a la persona que todavía no leyó" do
      publicar("Uno")
      publicar("Dos")

      expect(panel_de(tutor)["anuncios_sin_leer"]).to eq(2)
      expect(panel_de(alumno)["anuncios_sin_leer"]).to eq(2)
    end

    it "descuenta las que ya leyó, sin alterar las de los demás" do
      version = publicar("Uno")
      publicar("Dos")
      post "/api/v1/entregas/lecturas", params: { anuncio_version_id: version }, headers: cabecera_de(tutor), as: :json

      expect(panel_de(tutor)["anuncios_sin_leer"]).to eq(1)
      expect(panel_de(alumno)["anuncios_sin_leer"]).to eq(2)
    end

    it "no cuenta los anuncios eliminados" do
      version = publicar("Uno")
      anuncio_id = AnuncioVersion.find(version).anuncio_id
      delete "/api/v1/anuncios/#{anuncio_id}", headers: cabecera_de(docente), as: :json

      expect(panel_de(tutor)["anuncios_sin_leer"]).to eq(0)
    end

    it "es cero para quien no es destinatario de ninguno: el docente y el directivo" do
      publicar("Uno")

      expect(panel_de(docente)["anuncios_sin_leer"]).to eq(0)
      expect(panel_de(directivo)["anuncios_sin_leer"]).to eq(0)
    end
  end

  describe "acceso" do
    it "sin token responde 401" do
      get "/api/v1/paneles/me", as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    it "con la credencial provisional sin sustituir responde 403 (RN-09)" do
      provisional = create(:usuario, :directivo, :con_credencial_provisional)

      get "/api/v1/paneles/me", headers: cabecera_de(provisional), as: :json

      expect(response).to have_http_status(:forbidden)
    end

    it "no expone datos internos: la respuesta sólo trae los cinco campos del panel" do
      expect(panel_de(tutor).keys).to contain_exactly("rol", "nombre", "opciones_habilitadas", "anuncios_sin_leer", "cursos")
    end
  end
end
