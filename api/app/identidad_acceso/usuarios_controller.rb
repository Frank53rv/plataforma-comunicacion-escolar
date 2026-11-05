# RF-43 Cambio obligatorio de credencial provisional · CU-02 ·
# RN-08, RN-09
# Prueba: CP-RF-43
#
# Tabla 18 · PATCH /api/v1/usuarios/me/contrasena · directivo, docente, tutor, alumno.
class UsuariosController < ApplicationController
  # Es la única operación que se habilita mientras la credencial siga siendo
  # provisional: RN-09 no admite ninguna otra.
  autoriza :cambiar_contrasena,
           roles: %w[directivo docente tutor alumno],
           con_credencial_provisional: true

  def cambiar_contrasena
    # Tabla 26 · «Credencial inválida» es el primer supuesto de la fila del 401. Que la
    # sesión sea válida no convierte en válida la contraseña que se presenta acá.
    unless usuario_actual.contrasena_valida?(parametros[:contrasena_actual])
      raise ErrorDeDominio::NoAutenticado.new(
        codigo: "contrasena_actual_invalida", detalle: "La credencial presentada no es válida."
      )
    end

    # RF-43 · RN-09 · cambiar la contraseña provisional es elegir otra.
    if parametros[:contrasena_nueva] == parametros[:contrasena_actual]
      raise ErrorDeDominio::DatosInaceptables.new(
        regla: "RN-09", detalle: "La contraseña nueva debe ser distinta de la actual."
      )
    end

    usuario_actual.update!(
      contrasena: parametros[:contrasena_nueva],
      credencial_provisional: false
    )

    # Tabla 31 · «usuario con credencial_provisional en falso».
    render json: usuario_actual.slice(:id, :nombre, :apellido, :rol, :credencial_provisional),
           status: :ok
  end

  private

  def parametros
    @parametros ||= params.permit(:contrasena_actual, :contrasena_nueva).tap do |p|
      if p[:contrasena_actual].blank? || p[:contrasena_nueva].blank?
        raise ErrorDeDominio::DatosInaceptables.new(
          detalle: "Se requieren la contraseña actual y la nueva."
        )
      end
    end
  end
end
