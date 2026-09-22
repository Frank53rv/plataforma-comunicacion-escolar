# Boundary 8 · datos ficticios.
FactoryBot.define do
  factory :codigo_activacion do
    association :usuario, factory: [ :usuario, :pendiente ]
    association :generador, factory: [ :usuario, :directivo ]
    codigo_hash { BCrypt::Password.create("K7PX9M4Q") }
    vence_en { Time.current + 7.days }
  end
end
