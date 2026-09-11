# RF-06 Activación de cuenta · CU-02 · RN-05, RN-06
# Prueba: CP-RF-06
#
# Tabla 27 · POST /api/v1/activaciones · sin autenticar.
# RN-06 · «La persona activa su cuenta con el código y define su propia contraseña; el
# código se invalida al usarse.»
class ActivacionesController < ApplicationController
  autoriza :crear, roles: Autorizacion::SIN_AUTENTICAR

  # Flujo principal de CU-02, pasos 2 a 5. El paso 1 —la entrega del código por el canal
  # que la institución ya utiliza— ocurre fuera del sistema.
  def crear
    # Paso 3 · el código existe, no fue utilizado y no venció.
    codigo = CodigoActivacion.localizar(parametros[:codigo])
    raise ErrorDeDominio::CodigoNoVigente unless codigo&.vigente?

    usuario = codigo.usuario

    # RN-11 · la baja revoca el acceso y el canje no puede restituirlo. La Tabla 35 pone
    # «cuenta dada de baja» en la fila del 401.
    if usuario.estado_dado_de_baja?
      raise ErrorDeDominio::NoAutenticado.new(
        codigo: "cuenta_dada_de_baja", detalle: "La cuenta no está habilitada."
      )
    end

    # Quality Spec · escribe en dos entidades: todo o nada. El bloqueo de la fila impide
    # que dos canjes simultáneos del mismo código prosperen ambos.
    ActiveRecord::Base.transaction do
      codigo.lock!
      raise ErrorDeDominio::CodigoNoVigente unless codigo.vigente?

      # Paso 5 · el código se invalida al usarse.
      codigo.update!(usado_en: Time.current)

      # Pasos 4 y 5 · la persona define su propia contraseña y la cuenta queda activa.
      usuario.update!(
        contrasena: parametros[:contrasena],
        estado: "activo",
        credencial_provisional: false
      )
    end

    render json: RespuestaDeSesion.para(usuario), status: :created
  end

  private

  def parametros
    @parametros ||= params.permit(:codigo, :contrasena).tap do |p|
      if p[:codigo].blank? || p[:contrasena].blank?
        raise ErrorDeDominio::DatosInaceptables.new(
          detalle: "Se requieren el código y la contraseña."
        )
      end
    end
  end
end
