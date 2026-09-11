# La suite deriva cientos de contraseñas y códigos. El costo mínimo acelera la
# ejecución sin tocar el costo de producción, que sigue siendo el de la biblioteca.
BCrypt::Engine.cost = BCrypt::Engine::MIN_COST
