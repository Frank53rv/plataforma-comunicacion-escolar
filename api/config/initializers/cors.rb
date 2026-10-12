# Tabla 30 · CORS_ORIGENES: orígenes autorizados a consumir la interfaz desde el
# navegador. RNF-06 y RNF-21: ninguna decisión de autorización se resuelve acá; esto
# sólo delimita desde qué origen el cliente puede emitir la petición.
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*ENV.fetch("CORS_ORIGENES", "").split(",").map(&:strip).reject(&:empty?))

    resource "*",
             headers: :any,
             methods: %i[get post put patch delete options head],
             credentials: false
  end
end
