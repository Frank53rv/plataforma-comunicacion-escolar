# Conjunto de datos de prueba · RNF-09 · Tabla 35, paso 4
namespace :datos_de_prueba do
  desc "Carga el conjunto de prueba de RNF-09: dos años lectivos, 184 cuentas y su historial"
  task cargar: :environment do
    resumen = DatosDePrueba.cargar
    puts "Conjunto de prueba cargado: #{resumen.map { |k, v| "#{v} #{k}" }.join(', ')}."
    puts "Todas las cuentas, bajo @#{DatosDePrueba::DOMINIO}, usan la contraseña «#{DatosDePrueba::CONTRASENA}»."
  end

  desc "Borra el conjunto de prueba y nada más que él"
  task borrar: :environment do
    DatosDePrueba.borrar
    puts "Conjunto de prueba borrado."
  end
end
