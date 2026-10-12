# Boundary 8 · datos ficticios.
FactoryBot.define do
  # Todo curso abre su canal grupal de tutores al crearse (RF-25): la fábrica lo reutiliza
  # en lugar de intentar un segundo, que el índice único parcial de la Tabla 27 rechaza.
  factory :conversacion do
    curso
    tipo { "grupal_de_tutores" }
    estado { "activa" }

    initialize_with { Conversacion.find_or_initialize_by(curso: curso, tipo: tipo) }
  end

  factory :participante do
    conversacion
    association :usuario, factory: [ :usuario, :docente ]
    incorporado_en { Time.current }
  end

  factory :mensaje do
    conversacion
    association :autor, factory: [ :usuario, :docente ]
    sequence(:cuerpo) { |n| "Mensaje #{n}" }
    enviado_en { Time.current }
  end
end
