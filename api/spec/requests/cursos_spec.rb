# RF-12 Administración de cursos · CU-03 · RN-02, RN-26
# Prueba: CP-RF-12
#
# Tabla 18 · POST /api/v1/cursos y PATCH /api/v1/cursos/{id} · directivo.
# Tabla 18 · GET /api/v1/cursos · directivo, docente; el docente ve sólo sus cursos.
# Tabla 29 · POST: anio_lectivo_id, nombre, turno. PATCH: nombre, turno.
require "rails_helper"

RSpec.describe "Administración de cursos", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:directivo) { create(:usuario, :directivo) }
  let(:anio_lectivo) { create(:anio_lectivo) }

  def crear_curso(anio_lectivo_id: anio_lectivo.id, nombre: "1º A", turno: "mañana", por: directivo)
    post "/api/v1/cursos",
         params: { anio_lectivo_id: anio_lectivo_id, nombre: nombre, turno: turno }.compact,
         headers: cabecera_de(por), as: :json
  end

  def editar_curso(curso, nombre: nil, turno: nil, por: directivo)
    patch "/api/v1/cursos/#{curso.id}", params: { nombre: nombre, turno: turno }.compact,
          headers: cabecera_de(por), as: :json
  end

  def listar_cursos(por:, **filtros)
    ruta = filtros.any? ? "/api/v1/cursos?#{filtros.to_query}" : "/api/v1/cursos"
    get ruta, headers: cabecera_de(por), as: :json
  end

  # CP-RF-12 · «Creación y edición de curso, con nombre repetido en el mismo año. Dos
  # cursos de igual nombre en el año lectivo vigente. El segundo se rechaza con 409.»
  describe "CP-RF-12 · creación y edición" do
    it "crea el curso dentro del año lectivo, conforme a CU-03 paso 2" do
      crear_curso(nombre: "1º A", turno: "mañana")

      expect(response).to have_http_status(:created)
      expect(cuerpo).to include(
        "anio_lectivo_id" => anio_lectivo.id, "nombre" => "1º A", "turno" => "mañana",
        "estado" => "vigente", "alumnos_vinculados" => 0
      )
    end

    it "rechaza con 409 y RN-26 el nombre de curso repetido en el mismo año (CU-03 E2)" do
      crear_curso(nombre: "1º A")
      expect(response).to have_http_status(:created)

      crear_curso(nombre: "1º A")

      expect(response).to have_http_status(:conflict)
      expect(cuerpo["regla"]).to eq("RN-26")
    end

    it "no rechaza el mismo nombre en un año lectivo distinto" do
      crear_curso(nombre: "1º A")
      otro_anio = create(:anio_lectivo, anio: anio_lectivo.anio + 1, estado: "cerrado")

      crear_curso(anio_lectivo_id: otro_anio.id, nombre: "1º A")

      expect(response).to have_http_status(:created)
    end

    it "edita nombre y turno mientras el año lectivo permanece vigente, conforme a CU-03 paso 3" do
      curso = create(:curso, anio_lectivo: anio_lectivo, nombre: "1º A", turno: "mañana")

      editar_curso(curso, nombre: "1º B", turno: "tarde")

      expect(response).to have_http_status(:ok)
      expect(cuerpo).to include("nombre" => "1º B", "turno" => "tarde")
    end

    it "rechaza con 409 y RN-26 editar el nombre a uno ya usado en el mismo año" do
      create(:curso, anio_lectivo: anio_lectivo, nombre: "1º A")
      curso_b = create(:curso, anio_lectivo: anio_lectivo, nombre: "1º B")

      editar_curso(curso_b, nombre: "1º A")

      expect(response).to have_http_status(:conflict)
      expect(cuerpo["regla"]).to eq("RN-26")
    end
  end

  describe "validaciones de forma · 422" do
    it "rechaza la petición sin alguno de los tres campos" do
      crear_curso(nombre: nil)
      expect(response).to have_http_status(:unprocessable_content)

      crear_curso(turno: nil)
      expect(response).to have_http_status(:unprocessable_content)

      expect(Curso.count).to eq(0)
    end

    it "responde 404 si el año lectivo no existe" do
      crear_curso(anio_lectivo_id: SecureRandom.uuid)

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET /api/v1/cursos" do
    it "responde la colección con la cantidad de alumnos vinculados, forma de la Tabla 28" do
      curso = create(:curso, anio_lectivo: anio_lectivo)
      create_list(:alumno_curso, 2, curso: curso)
      create(:alumno_curso, curso: curso, vigente_hasta: Date.current)

      listar_cursos(por: directivo)

      expect(response).to have_http_status(:ok)
      fila = cuerpo["datos"].find { |c| c["id"] == curso.id }
      expect(fila["alumnos_vinculados"]).to eq(2)
      expect(cuerpo).to include("total" => 1, "pagina" => 1, "por_pagina" => 25)
    end

    it "filtra por anio_lectivo_id y por estado" do
      curso_vigente = create(:curso, anio_lectivo: anio_lectivo, estado: "vigente")
      otro_anio = create(:anio_lectivo, anio: anio_lectivo.anio + 1, estado: "cerrado")
      curso_archivado = create(:curso, anio_lectivo: otro_anio, estado: "archivado")

      listar_cursos(por: directivo, anio_lectivo_id: anio_lectivo.id)
      expect(cuerpo["datos"].pluck("id")).to contain_exactly(curso_vigente.id)

      listar_cursos(por: directivo, estado: "archivado")
      expect(cuerpo["datos"].pluck("id")).to contain_exactly(curso_archivado.id)
    end

    # El docente ve únicamente los cursos a los que tiene una vinculación
    # vigente, igual que en toda otra operación de RN-03/RN-07.
    it "restringe al docente a sus propios cursos vigentes" do
      docente = create(:usuario, :docente)
      curso_propio = create(:curso, anio_lectivo: anio_lectivo)
      create(:docente_curso, docente: docente, curso: curso_propio)
      curso_ajeno = create(:curso, anio_lectivo: anio_lectivo, nombre: "Otro curso")

      listar_cursos(por: docente)

      expect(cuerpo["datos"].pluck("id")).to contain_exactly(curso_propio.id)
      expect(cuerpo["datos"].pluck("id")).not_to include(curso_ajeno.id)
    end
  end

  describe "autorización" do
    it "admite al directivo a crear y a editar" do
      crear_curso
      expect(response).to have_http_status(:created)

      editar_curso(Curso.last, nombre: "Otro nombre")
      expect(response).to have_http_status(:ok)
    end

    it "admite al directivo y al docente a listar" do
      listar_cursos(por: directivo)
      expect(response).to have_http_status(:ok)

      listar_cursos(por: create(:usuario, :docente))
      expect(response).to have_http_status(:ok)
    end

    %w[docente tutor alumno].each do |rol|
      it "rechaza a #{rol} con 403 al crear, sin efectos" do
        crear_curso(por: create(:usuario, rol: rol))

        expect(response).to have_http_status(:forbidden)
        expect(Curso.count).to eq(0)
      end

      it "rechaza a #{rol} con 403 al editar" do
        curso = create(:curso, anio_lectivo: anio_lectivo)

        editar_curso(curso, nombre: "Otro", por: create(:usuario, rol: rol))

        expect(response).to have_http_status(:forbidden)
      end
    end

    %w[tutor alumno].each do |rol|
      it "rechaza a #{rol} con 403 al listar" do
        listar_cursos(por: create(:usuario, rol: rol))

        expect(response).to have_http_status(:forbidden)
      end
    end

    it "rechaza sin token con 401 en las tres operaciones" do
      post "/api/v1/cursos", params: { anio_lectivo_id: anio_lectivo.id, nombre: "1º A", turno: "mañana" },
           as: :json
      expect(response).to have_http_status(:unauthorized)

      get "/api/v1/cursos", as: :json
      expect(response).to have_http_status(:unauthorized)

      patch "/api/v1/cursos/#{SecureRandom.uuid}", params: { nombre: "x" }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
