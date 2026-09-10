# RNF-20 · CP-RNF-20 · la cobertura de líneas de la interfaz de programación se mide con
# SimpleCov sobre la ejecución completa de la suite, y el umbral se configura en la
# propia herramienta, de modo que la ejecución falla por debajo del 70 %.
require "simplecov"

SimpleCov.start "rails" do
  enable_coverage :line
  minimum_coverage line: 70

  # Los módulos de la Figura 18 se reportan por separado, de modo que la evidencia de
  # cobertura se lea contra la columna «Módulo / componente» de la Tabla 22.
  group "A · Identidad y acceso",     "app/identidad_acceso"
  group "B · Estructura académica",   "app/estructura_academica"
  group "C · Anuncios",               "app/anuncios"
  group "D · Mensajería",             "app/mensajeria"
  group "E · Notificaciones",         "app/notificaciones"
  group "G · Transversal",            "app/compartido"
end

RSpec.configure do |config|
  config.expect_with :rspec do |expectations|
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end

  config.mock_with :rspec do |mocks|
    mocks.verify_partial_doubles = true
  end

  config.shared_context_metadata_behavior = :apply_to_host_groups
  config.filter_run_when_matching :focus
  config.disable_monkey_patching!
  config.order = :random
  Kernel.srand config.seed
end
