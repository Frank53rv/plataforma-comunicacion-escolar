# Boundary 8 · datos ficticios.
FactoryBot.define do
  factory :preferencia do
    association :usuario, factory: [ :usuario, :docente ]
    hora_inicio { "00:00" }
    hora_fin { "00:00" }
    recibir_mensajes { true }
  end

  factory :suscripcion_push do
    association :usuario, factory: [ :usuario, :tutor ]
    sequence(:token) { |n| "token-de-prueba-#{n}" }
    navegador { "Firefox" }
    estado { "vigente" }
    creada_en { Time.current }
    trait(:invalida) do
      estado { "invalida" }
      invalidada_en { Time.current }
    end
  end

  factory :bitacora_envio do
    causa { "indisponibilidad_del_servicio_push" }
    codigo_proveedor { "503" }
    ocurrido_en { Time.current }
  end
end
