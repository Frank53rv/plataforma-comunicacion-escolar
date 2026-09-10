# Tabla 27 · Inventario de endpoints · RNF-17 · Boundary 4
# Ninguna ruta fuera de las 43 que la tabla declara. El prefijo es el de la Tabla 39.
# La compuerta `contrato` de bin/verificar contrasta este archivo contra el inventario
# y contra openapi/openapi.yaml, con diferencia nula en los tres sentidos.
Rails.application.routes.draw do
  scope "/api/v1", defaults: { format: :json } do
    # CU-01 · Autenticarse · RF-01
    post   "sesiones", to: "sesiones#crear"
    delete "sesiones", to: "sesiones#destruir"

    # CU-02 · Activar cuenta con código · RF-43
    patch "usuarios/me/contrasena", to: "usuarios#cambiar_contrasena"
  end

  # Comprobación de salud del contenedor (Tabla 45). No pertenece a la interfaz
  # versionada y la compuerta `contrato` no la considera.
  get "up" => "rails/health#show", as: :rails_health_check
end
