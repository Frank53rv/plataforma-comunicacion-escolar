# RF-01 Autenticación de usuarios · CU-01 · RN-15
# Prueba: CP-RF-01 · CP-RNF-02
#
# RNF-02 · «El token es firmado y verificable sin estado, con vencimiento no superior a
# 24 horas. Todo token expirado o alterado es rechazado.»
# Tabla 34 · JSON Web Token (RFC 7519). Tabla 41 · JWT_SECRET_KEY y JWT_EXPIRACION_HORAS.
class TokenDeSesion
  ALGORITMO = "HS256".freeze

  # RNF-02 fija el techo. Una configuración que lo supere se recorta acá y no se acata:
  # el umbral es del requisito y no de la variable de entorno.
  VENCIMIENTO_MAXIMO_HORAS = 24

  class << self
    # Paso 3 de CU-01 · «emite un token firmado, con vencimiento no superior a
    # veinticuatro horas, que transporta la identidad y el rol».
    def emitir(usuario, vence_en: nil)
      vence_en ||= Time.current + horas_de_vigencia.hours
      carga = {
        sub: usuario.id,
        rol: usuario.rol,
        exp: vence_en.to_i,
        iat: Time.current.to_i
      }

      { token: JWT.encode(carga, clave, ALGORITMO), vence_en: vence_en }
    end

    # Verificable sin estado: la firma y el vencimiento se comprueban sobre el propio
    # token, sin consultar la base.
    def verificar(token)
      carga, = JWT.decode(token.to_s, clave, true, algorithm: ALGORITMO)
      carga
    rescue JWT::DecodeError, JWT::ExpiredSignature
      raise ErrorDeDominio::NoAutenticado.new(
        codigo: "token_invalido", detalle: "La sesión no es válida."
      )
    end

    private

    def clave
      ENV.fetch("JWT_SECRET_KEY") do
        raise KeyError, "falta JWT_SECRET_KEY (Tabla 41)"
      end
    end

    def horas_de_vigencia
      configuradas = ENV.fetch("JWT_EXPIRACION_HORAS", VENCIMIENTO_MAXIMO_HORAS).to_i
      return VENCIMIENTO_MAXIMO_HORAS unless configuradas.positive?

      [ configuradas, VENCIMIENTO_MAXIMO_HORAS ].min
    end
  end
end
