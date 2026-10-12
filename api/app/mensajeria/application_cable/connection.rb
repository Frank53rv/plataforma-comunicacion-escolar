# RF-25 Canal grupal del curso · CU-12 · RN-23
# Prueba: CP-RF-25
#
# Tabla 29 · WSS /cable · «token en el parámetro de conexión». Figura 8 · «conectar canal
# (WSS) con el mismo token de la interfaz». Tabla 23 · el token se verifica sin estado
# también en el canal de tiempo real.
module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :usuario_actual

    def connect
      self.usuario_actual = usuario_del_token
    end

    private

    # Las mismas condiciones que la interfaz HTTP: token válido, cuenta que puede
    # autenticarse (CU-01 E2) y credencial ya sustituida (RF-43).
    def usuario_del_token
      carga = TokenDeSesion.verificar(request.params[:token])
      usuario = Usuario.find_by(id: carga["sub"])
      return usuario if usuario&.puede_autenticarse? && !usuario.credencial_provisional?

      reject_unauthorized_connection
    rescue ErrorDeDominio::NoAutenticado
      reject_unauthorized_connection
    end
  end
end
