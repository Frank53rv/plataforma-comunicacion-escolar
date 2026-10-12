# Boundary 8 · ningún dato real de personas ni de la institución: sólo datos ficticios.
FactoryBot.define do
  factory :usuario do
    sequence(:nombre)   { |n| "Nombre#{n}" }
    sequence(:apellido) { |n| "Apellido#{n}" }
    sequence(:correo)   { |n| "persona#{n}@ejemplo.test" }
    rol                 { "docente" }
    estado              { "activo" }
    credencial_provisional { false }
    creado_en           { Time.current }
    contrasena          { "clave-de-prueba-123" }

    trait(:directivo) { rol { "directivo" } }
    trait(:docente)   { rol { "docente" } }
    trait(:tutor)     { rol { "tutor" } }
    trait(:alumno)    { rol { "alumno" } }

    # RN-11 · la baja es lógica: revoca el acceso y conserva el historial
    trait(:dado_de_baja) { estado { "dado_de_baja" } }

    # RN-09 · credencial provisional pendiente de cambio en el primer acceso
    trait(:con_credencial_provisional) { credencial_provisional { true } }

    # La cuenta existe pero todavía no fue activada con su código (CU-02)
    trait :pendiente do
      estado { "pendiente" }
      contrasena { SecureRandom.base58(32) }
    end
  end
end
