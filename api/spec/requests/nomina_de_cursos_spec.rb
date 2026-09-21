# RF-12 Gestión de cursos · CU-03, CU-04, CU-05 · RN-13, RN-15
# Prueba: CP-RF-12
require "rails_helper"

# Tabla 29 · GET /cursos → «colección de curso con la cantidad de alumnos vinculados». La
# Tabla 18 no tiene ninguna operación que lea personas, y las tareas de administrar docentes,
# alumnos y tutores (TC-03 a TC-10) piden el identificador de una persona que el cliente no
# tiene de otro modo: por eso cada curso lleva también su nómina —docentes, y alumnos con sus
# tutores— sobre vinculaciones vigentes. No se agrega ninguna ruta ni se cambia ningún rol.
RSpec.describe "Nómina de los cursos en GET /cursos", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:curso) { create(:curso, nombre: "Primero A") }
  let(:directivo) { create(:usuario, :directivo) }
  let(:titular) { create(:usuario, :docente, nombre: "Ana", apellido: "Zárate") }
  let(:auxiliar) { create(:usuario, :docente, nombre: "Luis", apellido: "Acosta") }
  let(:alumno) { create(:usuario, :alumno, nombre: "Beto", apellido: "Ramos") }
  let(:tutor) { create(:usuario, :tutor, nombre: "Marta", apellido: "Ramos") }

  before do
    create(:docente_curso, docente: titular, curso: curso, es_titular: true)
    create(:docente_curso, docente: auxiliar, curso: curso, es_titular: false)
    create(:alumno_curso, alumno: alumno, curso: curso)
    create(:tutor_alumno, tutor: tutor, alumno: alumno)
  end

  def consultar(por)
    get "/api/v1/cursos", headers: cabecera_de(por), as: :json
    cuerpo["datos"].find { |c| c["id"] == curso.id }
  end

  it "cada curso trae sus docentes, con quién es titular, ordenados con el titular primero" do
    docentes = consultar(directivo)["docentes"]

    expect(docentes.map { |d| [ d["nombre"], d["es_titular"] ] }).to eq([ [ "Ana", true ], [ "Luis", false ] ])
    expect(docentes.first).to include("id" => titular.id, "apellido" => "Zárate", "correo" => titular.correo,
                                      "estado" => "activo")
  end

  it "cada alumno trae sus tutores" do
    alumnos = consultar(directivo)["alumnos"]

    expect(alumnos.size).to eq(1)
    expect(alumnos.first).to include("id" => alumno.id, "nombre" => "Beto")
    expect(alumnos.first["tutores"].map { |t| t["id"] }).to eq([ tutor.id ])
  end

  it "conserva la cantidad de alumnos vinculados que la Tabla 29 fija" do
    expect(consultar(directivo)["alumnos_vinculados"]).to eq(1)
  end

  it "trae el estado de cada persona, para saber quién está pendiente de activación" do
    pendiente = create(:usuario, :tutor, estado: "pendiente")
    create(:tutor_alumno, tutor: pendiente, alumno: alumno)

    tutores = consultar(directivo)["alumnos"].first["tutores"]

    expect(tutores.to_h { |t| [ t["id"], t["estado"] ] }).to eq(tutor.id => "activo", pendiente.id => "pendiente")
  end

  it "no incluye las vinculaciones que terminaron" do
    DocenteCurso.find_by!(docente: auxiliar).update!(vigente_hasta: Time.current.to_date)
    TutorAlumno.find_by!(tutor: tutor).update!(vigente_hasta: Time.current.to_date)
    AlumnoCurso.find_by!(alumno: alumno).update!(vigente_hasta: Time.current.to_date)

    resultado = consultar(directivo)

    expect(resultado["docentes"].map { |d| d["id"] }).to eq([ titular.id ])
    expect(resultado["alumnos"]).to be_empty
  end

  it "una persona dada de baja sigue figurando, marcada, mientras su vinculación esté vigente" do
    alumno.update!(estado: "dado_de_baja")

    expect(consultar(directivo)["alumnos"].first["estado"]).to eq("dado_de_baja")
  end

  it "el docente la recibe de sus cursos y sólo de ellos" do
    ajeno = create(:curso, nombre: "Ajeno")
    create(:docente_curso, docente: create(:usuario, :docente), curso: ajeno)

    get "/api/v1/cursos", headers: cabecera_de(titular), as: :json

    expect(cuerpo["datos"].pluck("id")).to eq([ curso.id ])
    expect(cuerpo["datos"].first["alumnos"].size).to eq(1)
  end

  it "no expone datos internos de las personas: sólo identificación, nombre, correo y estado" do
    persona = consultar(directivo)["docentes"].first

    expect(persona.keys).to contain_exactly("id", "nombre", "apellido", "correo", "estado", "es_titular")
    expect(consultar(directivo)["alumnos"].first.keys).to contain_exactly("id", "nombre", "apellido", "correo", "estado", "tutores")
  end

  it "un curso sin personas responde listas vacías" do
    vacio = create(:curso, nombre: "Vacío")

    get "/api/v1/cursos", headers: cabecera_de(directivo), as: :json
    fila = cuerpo["datos"].find { |c| c["id"] == vacio.id }

    expect(fila).to include("docentes" => [], "alumnos" => [])
  end

  # RNF-09 · las consultas no crecen con la cantidad de alumnos: se resuelven por lotes.
  it "no lanza una consulta por alumno ni por tutor" do
    def contar_consultas
      cantidad = 0
      contador = ->(*, carga) { cantidad += 1 unless carga[:name] == "SCHEMA" || carga[:sql].match?(/\A\s*(BEGIN|COMMIT|SAVEPOINT|RELEASE)/i) }
      ActiveSupport::Notifications.subscribed(contador, "sql.active_record") { yield }
      cantidad
    end

    # La primera petición paga el calentamiento de cachés: no se cuenta.
    get "/api/v1/cursos", headers: cabecera_de(directivo), as: :json
    con_pocos = contar_consultas { get "/api/v1/cursos", headers: cabecera_de(directivo), as: :json }
    8.times do
      otro = create(:usuario, :alumno)
      create(:alumno_curso, alumno: otro, curso: curso)
      create(:tutor_alumno, tutor: create(:usuario, :tutor), alumno: otro)
    end
    con_muchos = contar_consultas { get "/api/v1/cursos", headers: cabecera_de(directivo), as: :json }

    expect(con_muchos).to eq(con_pocos)
  end
end
