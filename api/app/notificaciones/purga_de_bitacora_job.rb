# RF-37 Degradación ante fallo de entrega · CU-14 · RNF-07, RN-27
# Prueba: CP-RF-37
#
# RNF-07 · la bitácora técnica de fallos de envío se conserva doce meses desde cada
# registro (RETENCION_BITACORA_MESES, Tabla 30). Recurrente: config/recurring.yml.
class PurgaDeBitacoraJob < ApplicationJob
  queue_as :default

  def perform
    BitacoraEnvio.purgar
  end
end
