# RF-01 Autenticación de usuarios · CU-01 · RN-15
# Prueba: CP-RF-01 · CP-RNF-02
#
# RNF-21 · el control de acceso reside en la interfaz de programación y nunca en el
# cliente. Este concern resuelve la identidad de quien pide. La verificación del rol
# se construye sobre él, en su propia rama.
module Autenticacion
  extend ActiveSupport::Concern

  private

  # Tabla 39 · encabezado de autorización con el esquema de portador.
  def usuario_actual
    @usuario_actual ||= begin
      carga = TokenDeSesion.verificar(token_presentado)
      usuario = Usuario.find_by(id: carga["sub"])

      # CU-01 E2 · la baja revoca el acceso, aunque el token siga vigente.
      raise ErrorDeDominio::NoAutenticado.new(
        codigo: "sesion_revocada", detalle: "La sesión no es válida."
      ) unless usuario&.puede_autenticarse?

      usuario
    end
  end

  def exigir_autenticacion
    usuario_actual
  end

  def token_presentado
    cabecera = request.headers["Authorization"].to_s
    esquema, token = cabecera.split(" ", 2)

    unless esquema&.casecmp?("Bearer") && token.present?
      raise ErrorDeDominio::NoAutenticado.new(
        codigo: "token_ausente", detalle: "La sesión no es válida."
      )
    end

    token
  end
end
