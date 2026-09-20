# Boundary 8 · datos ficticios.
FactoryBot.define do
  factory :preferencia do
    association :usuario, factory: [ :usuario, :docente ]
    hora_inicio { "00:00" }
    hora_fin { "00:00" }
    recibir_mensajes { true }
  end
end
