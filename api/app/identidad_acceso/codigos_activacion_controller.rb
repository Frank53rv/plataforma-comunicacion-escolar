# RF-07 Regeneración de código de activación · CU-04, CU-05 · RN-07, RN-08
# Prueba: CP-RF-07
#
# Tabla 27 · POST /api/v1/usuarios/{id}/codigos-activacion · «Directivo (docentes),
# docente (alumnos y tutores)».
# Tabla 40 · sin cuerpo → codigo_activacion con vence_en y el código en claro, devuelto
# una sola vez.
class CodigosActivacionController < ApplicationController
  autoriza :crear, roles: %w[directivo docente]

  def crear
    persona = Usuario.find(params[:id])

    # RN-07 · la cadena decide sobre quién. CP-RF-07 · «el docente ajeno obtiene 403».
    # Se verifica antes que el estado de la cuenta, de modo que quien no tiene la
    # atribución no averigüe nada sobre la persona.
    unless CadenaDeRegeneracion.permite?(quien: usuario_actual, para: persona)
      raise ErrorDeDominio::NoHabilitado.new(
        codigo: "fuera_de_la_cadena_de_regeneracion",
        detalle: "No tiene la atribución de regenerar el código de esta persona."
      )
    end

    # D-12 · sólo se regenera el código de una cuenta pendiente. Restablecer el acceso
    # de una cuenta activa es la recuperación de contraseña, requisito Should have.
    unless persona.estado_pendiente?
      raise ErrorDeDominio::DatosInaceptables.new(
        detalle: "Sólo se regenera el código de una cuenta pendiente de activación."
      )
    end

    registro, en_claro = CodigoActivacion.regenerar(usuario: persona, generado_por: usuario_actual)

    render json: registro.representacion(codigo_en_claro: en_claro), status: :created
  end
end
