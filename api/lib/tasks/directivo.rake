# RF-43 · RN-08 · Tabla 37, paso 5
# «Reponer la credencial provisional de la cuenta directiva por variable de entorno.»
namespace :directivo do
  desc "Repone la credencial provisional de la cuenta directiva (RN-08 · Tabla 32)"
  task reponer_credencial: :environment do
    directivo = CuentaDirectivaSemilla.reponer
    puts "Cuenta directiva repuesta: #{directivo.correo}"
    puts "Exige el cambio de credencial en el primer acceso (RF-43)."
  end
end
