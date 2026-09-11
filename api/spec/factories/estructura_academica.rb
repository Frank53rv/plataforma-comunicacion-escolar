# Boundary 8 · datos ficticios.
FactoryBot.define do
  factory :anio_lectivo do
    sequence(:anio) { |n| 2026 + n }
    estado { "vigente" }
    abierto_en { Time.current }
  end

  factory :curso do
    anio_lectivo
    sequence(:nombre) { |n| "Curso #{n}" }
    turno { "mañana" }
    estado { "vigente" }
  end

  factory :docente_curso do
    association :docente, factory: [ :usuario, :docente ]
    curso
    es_titular { false }
    vigente_desde { Time.current.to_date }
  end
end
