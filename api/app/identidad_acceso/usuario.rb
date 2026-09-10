# RF-01 Autenticación de usuarios · CU-01 · RN-04, RN-11, RN-15
# Prueba: CP-RF-01 · CP-RNF-03
#
# Tabla 21 · «Persona con acceso al sistema, bajo un único rol.»
# Tabla 38 · nombre de tabla en singular conforme a D-01.
class Usuario < ApplicationRecord
  self.table_name = "usuario"

  # RN-04 · una persona tiene exactamente un rol. Quien cumple dos funciones en la
  # institución opera con dos cuentas separadas.
  enum :rol, {
    directivo: "directivo", docente: "docente", tutor: "tutor", alumno: "alumno"
  }, validate: true

  # RN-11 · toda baja es lógica: revoca el acceso y conserva la totalidad del historial.
  enum :estado, {
    pendiente: "pendiente", activo: "activo", dado_de_baja: "dado_de_baja"
  }, prefix: :estado, validate: true

  validates :nombre, :apellido, :correo, presence: true
  validates :correo, uniqueness: { case_sensitive: false }

  before_validation :registrar_creacion, on: :create

  # RNF-03 · las contraseñas se almacenan mediante derivación no reversible con bcrypt.
  # El valor en claro no se conserva en ningún atributo ni se expone en ninguna consulta.
  def contrasena=(valor)
    self.contrasena_hash = valor.present? ? BCrypt::Password.create(valor) : nil
  end

  def contrasena_valida?(valor)
    return false if contrasena_hash.blank? || valor.blank?

    BCrypt::Password.new(contrasena_hash) == valor
  end

  # CU-01 precondición · «la cuenta existe y está activada».
  # CU-01 E2 · la cuenta dada de baja tiene el acceso revocado.
  def puede_autenticarse?
    estado_activo? && contrasena_hash.present?
  end

  private

  def registrar_creacion
    self.creado_en ||= Time.current
  end
end
