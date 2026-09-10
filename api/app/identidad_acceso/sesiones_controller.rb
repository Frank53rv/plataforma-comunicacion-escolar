# RF-01 Autenticación de usuarios · CU-01 · RN-09, RN-11, RN-15
# Prueba: CP-RF-01 · CP-RNF-02 · CP-RNF-03
#
# Tabla 27 · POST /api/v1/sesiones (sin autenticar) · DELETE /api/v1/sesiones
# (directivo, docente, tutor, alumno).
class SesionesController < ApplicationController
  before_action :exigir_autenticacion, only: :destruir

  # Flujo principal de CU-01, pasos 1 a 3.
  def crear
    usuario = Usuario.find_by(correo: parametros[:correo])

    # CU-01 E1 · «un mensaje que no distingue cuál de los dos datos falló». El rechazo
    # es idéntico para el correo inexistente, la contraseña errónea, la cuenta sin
    # activar y la cuenta dada de baja (E2).
    unless usuario&.puede_autenticarse? && usuario.contrasena_valida?(parametros[:contrasena])
      raise ErrorDeDominio::NoAutenticado
    end

    emitido = TokenDeSesion.emitir(usuario)

    render json: {
      token: emitido[:token],
      vence_en: emitido[:vence_en],
      usuario: usuario_publico(usuario)
    }, status: :created
  end

  # RNF-02 · el token es verificable sin estado. Cerrar la sesión consiste en que el
  # cliente descarte el token: mantener una lista de tokens revocados introduciría el
  # estado que el requisito excluye. La operación verifica la sesión y responde sin
  # cuerpo, conforme a la Tabla 40.
  def destruir
    head :no_content
  end

  private

  # Tabla 40 · «usuario con id, nombre, apellido, rol y credencial_provisional».
  # La derivación de la contraseña no figura (RNF-03).
  def usuario_publico(usuario)
    usuario.slice(:id, :nombre, :apellido, :rol, :credencial_provisional)
  end

  def parametros
    @parametros ||= params.permit(:correo, :contrasena).tap do |p|
      if p[:correo].blank? || p[:contrasena].blank?
        raise ErrorDeDominio::DatosInaceptables.new(
          detalle: "Se requieren el correo y la contraseña."
        )
      end
    end
  end
end
