# Boundary 8 · datos ficticios.
FactoryBot.define do
  factory :anuncio do
    association :autor, factory: [ :usuario, :docente ]
    estado { "publicado" }
    creado_en { Time.current }
  end

  factory :anuncio_version do
    anuncio
    sequence(:numero_version) { |n| n }
    titulo { "Título de prueba" }
    cuerpo { "Cuerpo de prueba." }
    publicado_en { Time.current }
  end

  factory :anuncio_curso do
    anuncio
    curso
  end

  factory :entrega_anuncio do
    anuncio_version
    association :destinatario, factory: [ :usuario, :alumno ]
    canal { "aplicacion" }
    enviada_en { Time.current }
  end
end
