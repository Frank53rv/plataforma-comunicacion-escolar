# RF-25 Canal grupal del curso · CU-12 · RN-23
# Prueba: CP-RF-25
#
# Tabla 14 · «Vinculación entre un usuario y una conversación.» Tabla 27 · UNIQUE
# (conversacion_id, usuario_id).
class Participante < ApplicationRecord
  self.table_name = "participante"

  belongs_to :conversacion, inverse_of: :participantes
  belongs_to :usuario

  validates :incorporado_en, presence: true
end
