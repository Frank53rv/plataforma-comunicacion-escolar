# RF-02 Control de acceso basado en roles · CU-01 · RN-04, RN-15
# Pruebas: CP-RF-02 · CP-RNF-01
#
# RNF-01 · «El 100 % de los endpoints que exponen datos académicos rechaza peticiones
# sin token válido o con rol no autorizado. Se verifica con una prueba de autorización
# por cada combinación de endpoint y rol.»
require "rails_helper"

RSpec.describe "Control de acceso basado en roles", type: :request do
  # El controlador anónimo exige una prueba de tipo «controller»: es lo que permite
  # ejercitar el mecanismo sin incorporar ninguna ruta al enrutador (Boundary 4).
  describe "el mecanismo · CP-RF-02", type: :controller do
    # «Token de directivo, docente, tutor y alumno sobre la misma operación.
    #  Solo el rol habilitado obtiene respuesta; los tres restantes, 403.»
    #
    # El controlador es anónimo: no incorpora ninguna ruta al enrutador, de modo que el
    # inventario de la Tabla 18 permanece intacto (Boundary 4).
    controller(ApplicationController) do
      autoriza :dato_academico, roles: %w[directivo]
      autoriza :sin_declarar_roles, roles: []

      def dato_academico       = render(json: { visible: true })
      def sin_declarar_roles   = render(json: { visible: true })
      def olvidada             = render(json: { visible: true })
    end

    before do
      routes.draw do
        get "dato_academico"     => "anonymous#dato_academico"
        get "sin_declarar_roles" => "anonymous#sin_declarar_roles"
        get "olvidada"           => "anonymous#olvidada"
      end
    end

    it "admite únicamente al rol habilitado" do
      request.headers.merge!(cabecera_de(create(:usuario, :directivo)))

      get :dato_academico

      expect(response).to have_http_status(:ok)
    end

    %w[docente tutor alumno].each do |rol|
      it "rechaza a #{rol} con 403, que es el estado que la Tabla 35 asigna" do
        request.headers.merge!(cabecera_de(create(:usuario, rol: rol)))

        get :dato_academico

        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)["codigo"]).to eq("rol_no_autorizado")
      end
    end

    it "rechaza sin token con 401 y no con 403, conforme al orden de la Tabla 35" do
      get :dato_academico

      expect(response).to have_http_status(:unauthorized)
    end

    it "deniega por omisión: una acción sin declaración responde 403" do
      request.headers.merge!(cabecera_de(create(:usuario, :directivo)))

      get :olvidada

      expect(response).to have_http_status(:forbidden)
    end

    it "una lista de roles vacía no habilita a nadie" do
      Inventario::ROLES.each do |rol|
        request.headers.merge!(cabecera_de(create(:usuario, rol: rol)))

        get :sin_declarar_roles

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  # CP-RF-02 · la misma verificación sobre una operación real de la Tabla 27 que expone
  # datos académicos: POST /cursos/{id}/docentes, habilitada sólo para el directivo.
  describe "CP-RF-02 · sobre una operación de datos académicos" do
    let(:curso) { create(:curso) }

    def vincular(por:)
      post "/api/v1/cursos/#{curso.id}/docentes",
           params: { usuario_id: create(:usuario, :docente).id, es_titular: false },
           headers: cabecera_de(por), as: :json
    end

    it "sólo el rol habilitado obtiene respuesta" do
      vincular(por: create(:usuario, :directivo))

      expect(response).to have_http_status(:created)
    end

    %w[docente tutor alumno].each do |rol|
      it "#{rol} recibe 403" do
        vincular(por: create(:usuario, rol: rol))

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  # CP-RNF-01 · «Las 36 operaciones HTTP Must have por los cuatro roles: 144 casos. Sin token,
  # 401 en el 100 %; con rol no autorizado, 403 en el 100 %.»
  #
  # La matriz se construye sobre las operaciones EFECTIVAMENTE expuestas en el enrutador
  # y crece con cada rama. Recorre la columna de roles de la Tabla 18 y no una lista
  # escrita a mano, de modo que no pueda divergir del inventario.
  describe "matriz de autorización · CP-RNF-01" do
    let(:construidas) { Inventario.construidas }

    it "cubre alguna operación" do
      expect(construidas).not_to be_empty
    end

    it "rechaza sin token el 100 % de las operaciones que exigen autenticación" do
      autenticadas = construidas.reject { |e| Inventario.roles_de(e) == :sin_autenticar }

      autenticadas.each do |e|
        public_send(e["metodo"].downcase, Inventario.ruta_concreta(e), as: :json)

        expect(response).to have_http_status(:unauthorized),
          "#{e['metodo']} #{e['ruta']} respondió #{response.status} sin token"
      end
    end

    it "rechaza con 403 el 100 % de las combinaciones de rol no autorizado" do
      construidas.each do |e|
        habilitados = Inventario.roles_de(e)
        next if habilitados == :sin_autenticar

        (Inventario::ROLES - habilitados).each do |rol|
          public_send(e["metodo"].downcase, Inventario.ruta_concreta(e),
                      headers: cabecera_de(create(:usuario, rol: rol)), as: :json)

          expect(response).to have_http_status(:forbidden),
            "#{e['metodo']} #{e['ruta']} respondió #{response.status} con rol #{rol}"
        end
      end
    end
  end

  # Boundary 4 · «no alterar los roles autorizados de una operación».
  describe "los roles declarados en el código reproducen la Tabla 18" do
    it "coincide operación por operación" do
      divergencias = Inventario.construidas.filter_map do |e|
        controlador = "#{e['controlador'].camelize}Controller".constantize
        declarados = controlador.roles_declarados_para(e["accion"])
        declarados = :sin_autenticar if declarados == Autorizacion::SIN_AUTENTICAR
        esperados = Inventario.roles_de(e)

        siguiente = declarados == :sin_autenticar ? declarados : Array(declarados).sort
        objetivo  = esperados  == :sin_autenticar ? esperados  : Array(esperados).sort

        "#{e['metodo']} #{e['ruta']}: declara #{siguiente.inspect}, la Tabla 27 dice #{objetivo.inspect}" \
          unless siguiente == objetivo
      end

      expect(divergencias).to be_empty, divergencias.join("\n")
    end
  end
end
