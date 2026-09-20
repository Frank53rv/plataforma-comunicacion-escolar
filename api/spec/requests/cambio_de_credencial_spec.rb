# RF-43 Cambio obligatorio de credencial provisional · CU-02 ·
# RN-08, RN-09
# Prueba: CP-RF-43
#
# Tabla 27 · PATCH /api/v1/usuarios/me/contrasena · directivo, docente, tutor, alumno.
# Tabla 40 · petición: contrasena_actual, contrasena_nueva. Respuesta: usuario con
# credencial_provisional en falso.
require "rails_helper"

RSpec.describe "Cambio de la credencial provisional", type: :request do
  def cuerpo = JSON.parse(response.body)

  let!(:directivo) do
    create(:usuario, :directivo, :con_credencial_provisional,
           correo: "directivo@ejemplo.test", contrasena: "provisional-de-reposicion")
  end

  # CP-RF-43 · RF-43 (Tabla 10): «El sistema debe exigir el cambio de la contraseña
  # provisional en el primer acceso y no debe habilitar ninguna otra operación hasta
  # que el cambio se complete.»
  describe "bloqueo hasta que el cambio se complete" do
    it "emite el token en el primer acceso, conforme a RF-43" do
      post "/api/v1/sesiones",
           params: { correo: "directivo@ejemplo.test", contrasena: "provisional-de-reposicion" },
           as: :json

      expect(response).to have_http_status(:created)
      expect(cuerpo["usuario"]["credencial_provisional"]).to be(true)
    end

    # RN-09 · «hasta entonces ninguna otra operación se habilita»
    it "responde 403 en toda otra operación de la interfaz" do
      Inventario.construidas.each do |e|
        next if Inventario.roles_de(e) == :sin_autenticar
        next if e["ruta"].end_with?("/usuarios/me/contrasena")

        public_send(e["metodo"].downcase, Inventario.ruta_concreta(e),
                    headers: cabecera_de(directivo), as: :json)

        expect(response).to have_http_status(:forbidden),
          "#{e['metodo']} #{e['ruta']} respondió #{response.status} con credencial provisional"
        expect(JSON.parse(response.body)["codigo"]).to eq("credencial_provisional_sin_cambiar")
      end
    end

    it "sí habilita la sustitución de la propia credencial" do
      patch "/api/v1/usuarios/me/contrasena",
            params: { contrasena_actual: "provisional-de-reposicion",
                      contrasena_nueva: "clave-propia-elegida" },
            headers: cabecera_de(directivo), as: :json

      expect(response).to have_http_status(:ok)
    end
  end

  describe "PATCH /api/v1/usuarios/me/contrasena" do
    it "sustituye la credencial y devuelve credencial_provisional en falso" do
      patch "/api/v1/usuarios/me/contrasena",
            params: { contrasena_actual: "provisional-de-reposicion",
                      contrasena_nueva: "clave-propia-elegida" },
            headers: cabecera_de(directivo), as: :json

      expect(response).to have_http_status(:ok)
      expect(cuerpo["credencial_provisional"]).to be(false)
      expect(directivo.reload.credencial_provisional).to be(false)
      expect(directivo.contrasena_valida?("clave-propia-elegida")).to be(true)
      expect(directivo.contrasena_valida?("provisional-de-reposicion")).to be(false)
      expect(response.body).not_to include("clave-propia-elegida")
    end

    it "habilita el resto de la interfaz una vez completado el cambio" do
      patch "/api/v1/usuarios/me/contrasena",
            params: { contrasena_actual: "provisional-de-reposicion",
                      contrasena_nueva: "clave-propia-elegida" },
            headers: cabecera_de(directivo), as: :json

      delete "/api/v1/sesiones", headers: cabecera_de(directivo.reload)

      expect(response).to have_http_status(:no_content)
    end

    # Tabla 35 · «Credencial inválida» es el primer supuesto de la fila del 401.
    it "rechaza con 401 la contraseña actual equivocada" do
      patch "/api/v1/usuarios/me/contrasena",
            params: { contrasena_actual: "no-es-la-suya", contrasena_nueva: "clave-propia-elegida" },
            headers: cabecera_de(directivo), as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(directivo.reload.credencial_provisional).to be(true)
    end

    it "rechaza con 422 la petición sin los campos de la Tabla 40" do
      patch "/api/v1/usuarios/me/contrasena", params: {},
            headers: cabecera_de(directivo), as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "rechaza sin token con 401" do
      patch "/api/v1/usuarios/me/contrasena",
            params: { contrasena_actual: "x", contrasena_nueva: "y" }, as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    # Tabla 42 · una prueba de autorización por cada uno de los cuatro roles.
    # RN-09 dice «toda credencial provisional», no sólo la del directivo.
    %w[directivo docente tutor alumno].each do |rol|
      it "admite a #{rol}, que la Tabla 27 declara autorizado" do
        usuario = create(:usuario, rol: rol, contrasena: "clave-anterior-123")

        patch "/api/v1/usuarios/me/contrasena",
              params: { contrasena_actual: "clave-anterior-123", contrasena_nueva: "clave-nueva-456" },
              headers: cabecera_de(usuario), as: :json

        expect(response).to have_http_status(:ok)
      end
    end
  end

  # RN-08 · «El sistema no dispone de recuperación autónoma de la cuenta directiva. Se
  # resuelve reponiendo la credencial provisional por variable de entorno.»
  # Tabla 46, paso 5.
  describe "reposición de la cuenta directiva por variable de entorno · RN-08" do
    before do
      allow(ENV).to receive(:fetch).and_call_original
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:fetch).with("DIRECTIVO_CORREO").and_return("semilla@ejemplo.test")
      allow(ENV).to receive(:fetch).with("DIRECTIVO_CREDENCIAL_PROVISIONAL")
                                   .and_return("credencial-de-reposicion")
    end

    it "crea la cuenta directiva con la credencial marcada como provisional" do
      CuentaDirectivaSemilla.reponer

      directivo = Usuario.find_by(correo: "semilla@ejemplo.test")
      expect(directivo.rol).to eq("directivo")
      expect(directivo.estado).to eq("activo")
      expect(directivo.credencial_provisional).to be(true)
      expect(directivo.contrasena_valida?("credencial-de-reposicion")).to be(true)
    end

    it "repone la credencial de la cuenta existente sin duplicarla ni tocar su historial" do
      existente = create(:usuario, :directivo, correo: "semilla@ejemplo.test",
                                   contrasena: "clave-olvidada", credencial_provisional: false)

      expect { CuentaDirectivaSemilla.reponer }.not_to change(Usuario, :count)

      existente.reload
      expect(existente.credencial_provisional).to be(true)
      expect(existente.contrasena_valida?("credencial-de-reposicion")).to be(true)
    end
  end
end
