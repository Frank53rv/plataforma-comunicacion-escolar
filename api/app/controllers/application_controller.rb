# Controlador base de la interfaz. RNF-21 · la totalidad de las reglas de negocio, el
# control de acceso y la lógica de notificación residen acá y nunca en el cliente.
class ApplicationController < ActionController::API
  include ManejadorDeErrores
end
