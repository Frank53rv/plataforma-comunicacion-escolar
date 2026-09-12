# RF-05 Generación de código de activación · CU-02, CU-05 · RN-01, RN-05
# Prueba: CP-RF-05
#
# RN-01 · «Nadie se auto-registra. El alta la realiza siempre otra persona con rol
# habilitado.» El registro exige quién lo hace, y ese dato queda en generado_por.
# RN-05 · «El alta genera un código de un solo uso con vencimiento de siete días.»
#
# Quality Spec · «Toda operación que escribe en más de una entidad se resuelve dentro de
# una transacción y rechaza sin efectos parciales.» La persona y su código se crean
# juntos o no se crea ninguno.
class RegistroDePersona
  Resultado = Data.define(:usuario, :codigo_activacion, :codigo_en_claro)

  def self.registrar(nombre:, apellido:, correo:, rol:, registrado_por:)
    ActiveRecord::Base.transaction do
      # La contraseña la define la propia persona al canjear su código (RN-06 · CU-02
      # paso 4). Hasta entonces la Tabla 38 exige contrasena_hash no nulo: se deriva un
      # valor aleatorio que no se conserva ni se comunica a nadie. La cuenta pendiente no
      # puede autenticarse con él porque no está activa (CU-01, precondición).
      usuario = Usuario.create!(
        nombre: nombre, apellido: apellido, correo: correo,
        rol: rol, estado: "pendiente", credencial_provisional: false,
        contrasena: SecureRandom.base58(32)
      )
      registro, en_claro = CodigoActivacion.generar(usuario: usuario, generado_por: registrado_por)

      Resultado.new(usuario: usuario, codigo_activacion: registro, codigo_en_claro: en_claro)
    end
  end
end
