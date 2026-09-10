# RF-02 Control de acceso basado en roles · CU-01 · RN-04, RN-15
# Prueba: CP-RF-02 · CP-RNF-01
#
# RNF-01 · «El 100 % de los endpoints que exponen datos académicos rechaza peticiones
# sin token válido o con rol no autorizado.»
# RNF-21 · el control de acceso reside en la interfaz y nunca en el cliente.
# Boundary 5 · ninguna operación que expone datos académicos omite la verificación de rol.
#
# La autorización se DECLARA por acción y se DENIEGA POR OMISIÓN: una acción sin
# declaración responde 403. Es lo que impide que un descuido deje una operación abierta,
# que es exactamente el modo en que RNF-01 dejaría de cumplirse sin que nadie lo note.
module Autorizacion
  extend ActiveSupport::Concern

  SIN_AUTENTICAR = :sin_autenticar

  included do
    class_attribute :roles_por_accion, default: {}.freeze
    before_action :exigir_rol_autorizado
  end

  class_methods do
    # Los roles son literalmente los de la columna «Roles autorizados» de la Tabla 27.
    # Alterarlos es una modificación del contrato y no una decisión del código
    # (Boundary 4).
    #
    # RN-09 · «Toda credencial provisional debe cambiarse en el primer acceso; hasta
    # entonces ninguna otra operación se habilita.» Sólo la operación que sustituye la
    # credencial declara con_credencial_provisional.
    def autoriza(*acciones, roles:, con_credencial_provisional: false)
      declaradas = acciones.index_with do
        { roles: roles, con_credencial_provisional: con_credencial_provisional }
      end
      self.roles_por_accion = roles_por_accion.merge(declaradas.stringify_keys).freeze
    end

    def roles_declarados_para(accion)
      roles_por_accion[accion.to_s]&.fetch(:roles)
    end
  end

  private

  def exigir_rol_autorizado
    declaracion = self.class.roles_por_accion[action_name]

    # Sin declaración no hay acceso. No se asume nada.
    raise ErrorDeDominio::NoHabilitado if declaracion.nil?

    declarados = declaracion[:roles]
    return if declarados == SIN_AUTENTICAR

    # El orden importa y lo fija la Tabla 35: 401 cuando el token falta o no vale;
    # 403 cuando está autenticado pero no habilitado.
    exigir_autenticacion
    exigir_credencial_definitiva unless declaracion[:con_credencial_provisional]

    return if Array(declarados).map(&:to_s).include?(usuario_actual.rol)

    # RN-04 · una persona tiene exactamente un rol: la comprobación es sobre ese único
    # valor y no sobre un conjunto de roles por persona.
    raise ErrorDeDominio::NoHabilitado.new(
      codigo: "rol_no_autorizado",
      detalle: "El rol de la sesión no tiene la atribución para esta operación."
    )
  end

  # RF-43 · «no debe habilitar ninguna otra operación hasta que el cambio se complete».
  # La lectura es literal: la única operación habilitada es la que sustituye la propia
  # credencial. El estado es el que la Tabla 35 asigna a «credencial provisional sin
  # cambiar» en la fila del 403.
  def exigir_credencial_definitiva
    return unless usuario_actual.credencial_provisional?

    raise ErrorDeDominio::NoHabilitado.new(
      codigo: "credencial_provisional_sin_cambiar",
      detalle: "Debe sustituir la credencial provisional antes de operar."
    )
  end
end
