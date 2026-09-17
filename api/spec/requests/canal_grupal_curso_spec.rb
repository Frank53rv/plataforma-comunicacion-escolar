# RF-25 Canal grupal del curso · CU-12 · RN-23
# Prueba: CP-RF-25
require "rails_helper"

RSpec.describe "Canal grupal del curso", type: :request do
  def cuerpo = JSON.parse(response.body)

  let(:directivo) { create(:usuario, :directivo) }
  let(:curso) { create(:curso, nombre: "B") }
  let(:docente) { create(:usuario, :docente) }
  let(:alumno) { create(:usuario, :alumno) }
  let(:tutor) { create(:usuario, :tutor) }

  def vincular_comunidad(al_curso: curso)
    create(:docente_curso, docente: docente, curso: al_curso)
    create(:alumno_curso, alumno: alumno, curso: al_curso)
    create(:tutor_alumno, tutor: tutor, alumno: alumno)
  end

  def canales_del_curso(por:, id: curso.id)
    get "/api/v1/cursos/#{id}/conversaciones", headers: cabecera_de(por), as: :json
  end

  def conversaciones(por:, **filtros)
    ruta = "/api/v1/conversaciones"
    ruta += "?#{filtros.to_query}" if filtros.any?
    get ruta, headers: cabecera_de(por), as: :json
  end

  # CP-RF-25 · «Curso recién creado. Canal disponible, integrado por sus docentes y los
  # tutores de sus alumnos.»
  describe "CP-RF-25 · canal existente desde la creación del curso" do
    it "el alta del curso abre su canal grupal de tutores, activo" do
      anio = create(:anio_lectivo)
      post "/api/v1/cursos", params: { anio_lectivo_id: anio.id, nombre: "1° A", turno: "mañana" },
                             headers: cabecera_de(directivo), as: :json

      expect(response).to have_http_status(:created)
      canal = Conversacion.find_by!(curso_id: cuerpo["id"])
      expect(canal).to have_attributes(tipo: "grupal_de_tutores", estado: "activa")
    end

    it "todo curso tiene exactamente un canal grupal de tutores, cualquiera sea la vía de alta" do
      expect(Conversacion.where(curso_id: curso.id).pluck(:tipo)).to eq([ "grupal_de_tutores" ])
    end

    it "el canal está disponible e integrado por sus docentes y los tutores de sus alumnos" do
      vincular_comunidad

      canales_del_curso(por: docente)

      expect(response).to have_http_status(:ok)
      canal = Conversacion.find_by!(curso_id: curso.id)
      expect(cuerpo["datos"]).to eq([
        { "id" => canal.id, "curso_id" => curso.id, "tipo" => "grupal_de_tutores", "estado" => "activa" }
      ])
      expect(canal.participantes.pluck(:usuario_id)).to contain_exactly(docente.id, tutor.id)
    end

    it "el tutor accede al canal del curso de su hijo" do
      vincular_comunidad

      canales_del_curso(por: tutor)

      expect(response).to have_http_status(:ok)
      expect(cuerpo["datos"].pluck("tipo")).to eq([ "grupal_de_tutores" ])
    end

    it "el alumno del curso no integra el canal de tutores: colección vacía" do
      vincular_comunidad

      canales_del_curso(por: alumno)

      expect(response).to have_http_status(:ok)
      expect(cuerpo).to include("datos" => [], "total" => 0, "pagina" => 1, "por_pagina" => 25)
      expect(Conversacion.find_by!(curso_id: curso.id).participantes.pluck(:usuario_id)).not_to include(alumno.id)
    end
  end

  describe "incorporación de los participantes" do
    it "registra como fecha de ingreso el inicio del día de la vinculación, en la zona del punto 4.2" do
      create(:docente_curso, docente: docente, curso: curso, vigente_desde: Date.new(2026, 3, 2))
      create(:alumno_curso, alumno: alumno, curso: curso, vigente_desde: Date.new(2026, 3, 5))
      create(:tutor_alumno, tutor: tutor, alumno: alumno, vigente_desde: Date.new(2026, 3, 1))

      canales_del_curso(por: docente)

      participantes = Conversacion.find_by!(curso_id: curso.id).participantes.index_by(&:usuario_id)
      expect(participantes[docente.id].incorporado_en).to eq(Time.find_zone("America/Asuncion").local(2026, 3, 2))
      # El tutor ingresa cuando se cumplen las dos vinculaciones: la más tardía.
      expect(participantes[tutor.id].incorporado_en).to eq(Time.find_zone("America/Asuncion").local(2026, 3, 5))
    end

    it "no duplica participantes en accesos sucesivos" do
      vincular_comunidad

      2.times { canales_del_curso(por: docente) }

      expect(Participante.where(usuario_id: docente.id).count).to eq(1)
    end
  end

  describe "GET /conversaciones · las conversaciones del usuario" do
    it "lista las del docente, por nombre del curso, con su último mensaje" do
      otro_curso = create(:curso, nombre: "A")
      vincular_comunidad
      create(:docente_curso, docente: docente, curso: otro_curso)
      canal = Conversacion.find_by!(curso_id: curso.id)
      travel_to(1.hour.ago) { create(:mensaje, conversacion: canal, autor: docente, cuerpo: "Primero") }
      create(:mensaje, conversacion: canal, autor: tutor, cuerpo: "Último")

      conversaciones(por: docente)

      expect(response).to have_http_status(:ok)
      expect(cuerpo).to include("total" => 2, "pagina" => 1, "por_pagina" => 25)
      expect(cuerpo["datos"].pluck("curso_id")).to eq([ otro_curso.id, curso.id ])
      expect(cuerpo["datos"].first["ultimo_mensaje"]).to be_nil
      ultimo = cuerpo["datos"].last["ultimo_mensaje"]
      expect(ultimo).to include("conversacion_id" => canal.id, "cuerpo" => "Último")
      expect(ultimo["autor"]).to include("id" => tutor.id, "rol" => "tutor")
      expect(ultimo["enviado_en"]).to be_present
    end

    it "lista las del tutor: los cursos de sus hijos" do
      vincular_comunidad

      conversaciones(por: tutor)

      expect(cuerpo["datos"].pluck("curso_id")).to eq([ curso.id ])
    end

    it "el alumno no tiene conversaciones en esta entrega" do
      vincular_comunidad

      conversaciones(por: alumno)

      expect(response).to have_http_status(:ok)
      expect(cuerpo).to include("datos" => [], "total" => 0)
    end

    it "no lista los cursos de una vinculación terminada" do
      create(:docente_curso, docente: docente, curso: curso, vigente_hasta: Time.current.to_date)

      conversaciones(por: docente)

      expect(cuerpo["datos"]).to be_empty
    end

    it "pagina con pagina y por_pagina (Tabla 28)" do
      3.times { |n| create(:docente_curso, docente: docente, curso: create(:curso, nombre: "C#{n}")) }

      conversaciones(por: docente, pagina: 2, por_pagina: 2)

      expect(cuerpo["datos"].size).to eq(1)
      expect(cuerpo).to include("total" => 3, "pagina" => 2, "por_pagina" => 2)
    end
  end

  describe "cursos ajenos o inexistentes" do
    it "responde 404 si el curso no existe" do
      canales_del_curso(por: docente, id: SecureRandom.uuid)
      expect(response).to have_http_status(:not_found)
    end

    %i[docente tutor alumno].each do |rol|
      it "responde 403 a un #{rol} no vinculado al curso" do
        vincular_comunidad
        canales_del_curso(por: create(:usuario, rol))
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "autorización" do
    it "rechaza al directivo con 403 en las dos operaciones" do
      canales_del_curso(por: directivo)
      expect(response).to have_http_status(:forbidden)
      conversaciones(por: directivo)
      expect(response).to have_http_status(:forbidden)
    end

    it "rechaza sin token con 401" do
      get "/api/v1/conversaciones", as: :json
      expect(response).to have_http_status(:unauthorized)
      get "/api/v1/cursos/#{curso.id}/conversaciones", as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
