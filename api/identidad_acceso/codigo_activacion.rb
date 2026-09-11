# RF-05 Generación de código de activación · RF-07 Regeneración · CU-02, CU-04, CU-05 ·
# RN-05, RN-07
# Prueba: CP-RF-05 · CP-RF-07
#
# Tabla 21 · «Código de un solo uso para la activación de una cuenta o la recuperación
# de acceso.» Único por usuario entre los vigentes. Vencimiento de siete días. Se
# invalida al usarse.
# Tabla 38 · nombre de tabla en singular conforme a D-01.
#
# D-11 · el código tiene la forma LLLLLLLL-SSSSSSSS. El localizador son los ocho
# primeros caracteres hexadecimales del id de la fila; el secreto son ocho caracteres
# del alfabeto de Crockford, derivados con bcrypt en codigo_hash «del mismo modo que la
# contraseña» (nota de la Tabla 40). El valor en claro no se almacena nunca.
class CodigoActivacion < ApplicationRecord
  self.table_name = "codigo_activacion"

  # RN-05 · «vencimiento de siete días»
  VIGENCIA = 7.days

  # Crockford: dígitos y mayúsculas sin I, L, O ni U, para transcribirse a mano.
  ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ".chars.freeze
  LARGO_SECRETO = 8
  LARGO_LOCALIZADOR = 8
  FORMA = /\A(?<localizador>[0-9A-F]{#{LARGO_LOCALIZADOR}})(?<secreto>[#{ALFABETO.join}]{#{LARGO_SECRETO}})\z/

  belongs_to :usuario
  belongs_to :generador, class_name: "Usuario", foreign_key: :generado_por

  scope :sin_usar, -> { where(usado_en: nil) }

  class << self
    # RF-05 · «Al registrar a una persona, el sistema debe generar un código de
    # activación de un solo uso, con vencimiento de siete días, asociado a ella.»
    # Devuelve la fila y el código en claro. El código en claro sólo existe en esta
    # respuesta y no vuelve a ser recuperable (nota de la Tabla 40 · D-10).
    def generar(usuario:, generado_por:)
      secreto = Array.new(LARGO_SECRETO) { ALFABETO[SecureRandom.random_number(ALFABETO.size)] }.join
      registro = create!(
        usuario: usuario,
        generador: generado_por,
        codigo_hash: BCrypt::Password.create(secreto),
        vence_en: Time.current + VIGENCIA
      )

      [ registro, "#{registro.localizador}-#{secreto}" ]
    end

    # RF-07 · «regenerar el código … cuando el anterior venció o se perdió, invalidando
    # el previo». D-09 · el código anterior recibe usado_en con la hora del reemplazo:
    # conserva la fila y su generado_por como rastro, y deja libre el índice parcial.
    def regenerar(usuario:, generado_por:)
      transaction do
        where(usuario: usuario).sin_usar.update_all(usado_en: Time.current)
        generar(usuario: usuario, generado_por: generado_por)
      end
    end

    # D-11 · localización del código presentado. Devuelve la fila sin usar cuyo secreto
    # coincide, o nil. La vigencia la decide quien canjea, no esta búsqueda.
    def localizar(presentado)
      partes = FORMA.match(normalizar(presentado))
      return if partes.nil?

      sin_usar
        .where("id::text LIKE ?", "#{partes[:localizador].downcase}%")
        .find { |candidato| candidato.secreto_coincide?(partes[:secreto]) }
    end

    # El código se entrega «por el canal que la institución ya utiliza» (RN-05) y se
    # transcribe a mano: mayúsculas, sin espacios ni guion, O por 0 e I o L por 1.
    def normalizar(presentado)
      presentado.to_s.upcase.delete(" -").tr("OIL", "011")
    end
  end

  def localizador
    id.delete("-")[0, LARGO_LOCALIZADOR].upcase
  end

  def secreto_coincide?(secreto)
    BCrypt::Password.new(codigo_hash) == secreto
  end

  # CU-02 paso 3 · el código existe, no fue utilizado y no venció.
  def vigente?
    usado_en.nil? && vence_en > Time.current
  end

  # Tabla 40 · «codigo_activacion con vence_en» y, en la operación que lo genera o
  # regenera, «el código en claro, devuelto una sola vez» (D-10). Nada más: la fila no
  # se expone como recurso.
  def representacion(codigo_en_claro: nil)
    base = { vence_en: vence_en }
    codigo_en_claro ? base.merge(codigo: codigo_en_claro) : base
  end
end
