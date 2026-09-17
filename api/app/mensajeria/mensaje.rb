# RF-25 Canal grupal del curso · CU-12 · RN-23
# Prueba: CP-RF-25
#
# Tabla 14 · «Unidad de comunicación dentro de una conversación.» Tabla 27 · índice sobre
# (conversacion_id, enviado_en descendente).
class Mensaje < ApplicationRecord
  self.table_name = "mensaje"

  belongs_to :conversacion, inverse_of: :mensajes
  belongs_to :autor, class_name: "Usuario", foreign_key: :autor_id

  validates :cuerpo, :enviado_en, presence: true

  # openapi/openapi.yaml · esquema Mensaje: `autor` es el recurso Usuario completo.
  def recurso
    slice(:id, :conversacion_id, :cuerpo, :enviado_en).merge("autor" => autor.recurso)
  end
end
