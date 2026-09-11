# Boundary 8 · datos ficticios.
FactoryBot.define do
  factory :anio_lectivo do
    sequence(:anio) { |n| 2026 + n }
    estado { "vigente" }
    abierto_en { Time.current }
  end

  factory :curso do
    # RN-31 · existe un solo año lectivo vigente: los cursos lo comparten. El motor
    # rechaza un segundo con el índice parcial de la Tabla 38.
    anio_lectivo { AnioLectivo.estado_vigente.first || association(:anio_lectivo) }
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

  factory :alumno_curso do
    association :alumno, factory: [ :usuario, :alumno ]
    curso
    vigente_desde { Time.current.to_date }
  end

  factory :tutor_alumno do
    association :tutor, factory: [ :usuario, :tutor ]
    association :alumno, factory: [ :usuario, :alumno ]
    vigente_desde { Time.current.to_date }
  end
end
