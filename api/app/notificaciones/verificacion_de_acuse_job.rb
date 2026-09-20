# RF-37 Degradación ante fallo de entrega · CU-14 · RNF-11
# Prueba: CP-RF-37
#
# RF-37 · ante «ausencia de acuse del cliente» el aviso se entrega dentro de la
# aplicación y se registra la causa. Figura 9 · el disparador de la transición a
# entregada es el acuse del cliente, y no la respuesta del servicio push.
class VerificacionDeAcuseJob < ApplicationJob
  queue_as :default

  def perform(entrega_id)
    entrega = EntregaAnuncio.find_by(id: entrega_id)
    return if entrega.nil? || entrega.entregada_en.present? || !entrega.canal_push?

    EnvioDeAviso.degradar(entrega, "ausencia_de_acuse_del_cliente", "sin_acuse")
  end
end
