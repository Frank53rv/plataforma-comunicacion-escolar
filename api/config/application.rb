require_relative "boot"

require "rails"
# Pick the frameworks you want:
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
# require "active_storage/engine"
require "action_controller/railtie"
# require "action_mailer/railtie"
# require "action_mailbox/engine"
# require "action_text/engine"
require "action_view/railtie"
require "action_cable/engine"
# require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Api
  class Application < Rails::Application
    config.load_defaults 8.1

    config.autoload_lib(ignore: %w[assets tasks])

    # Figura 18 · los cinco módulos funcionales y el componente transversal son carpetas
    # propias directamente bajo api/, tal como las dibuja la figura, de modo que toda
    # unidad de código se remonte a su fila de la Tabla 22. Se declaran como raíces de
    # carga —también para la carga anticipada de producción— para que no impongan un
    # espacio de nombres y los identificadores reproduzcan el diccionario (Tabla 37).
    MODULOS = %w[identidad_acceso estructura_academica anuncios mensajeria notificaciones compartido].freeze
    MODULOS.each do |modulo|
      config.autoload_paths << Rails.root.join(modulo)
      config.eager_load_paths << Rails.root.join(modulo)
    end

    # Punto 4.2, semántica temporal · la zona de interpretación es una sola y el
    # almacenamiento permanece en tiempo universal coordinado. No se declara una zona
    # por usuario ni ninguna otra zona, ni configurable ni por omisión.
    config.time_zone = "America/Asuncion"
    config.active_record.default_timezone = :utc

    # Tabla 39 · identificador universal único en las rutas y en los cuerpos.
    # No se exponen enteros secuenciales (RN-15).
    config.generators do |g|
      g.orm :active_record, primary_key_type: :uuid
    end

    # Tabla 34 · cola de trabajos sobre la misma base de datos (D-08)
    config.active_job.queue_adapter = :solid_queue

    config.api_only = true
  end
end
