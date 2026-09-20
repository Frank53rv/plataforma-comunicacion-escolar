# RF-37 Degradación ante fallo de entrega · CU-14 · RNF-11, RNF-12
# Prueba: CP-RF-37
#
# RNF-12 · «Los envíos fallidos por causa transitoria se reintentan desde la cola.» Los
# reintentos siguen PoliticaDeEnvio::REINTENTOS; agotados, RF-37 exige entregar el aviso
# dentro de la aplicación y registrar la causa.
class EnvioDeAvisoJob < ApplicationJob
  queue_as :default

  retry_on EnvioDeAviso::ErrorTransitorio,
           wait: ->(ejecuciones) { PoliticaDeEnvio::REINTENTOS.fetch(ejecuciones - 1) },
           attempts: PoliticaDeEnvio::REINTENTOS.size + 1 do |trabajo, error|
    entrega = EntregaAnuncio.find_by(id: trabajo.arguments.first)
    EnvioDeAviso.degradar(entrega, "indisponibilidad_del_servicio_push", error.codigo) if entrega
  end

  def perform(entrega_id, titulo, cuerpo)
    entrega = EntregaAnuncio.find_by(id: entrega_id)
    return if entrega.nil? || entrega.entregada_en.present?

    EnvioDeAviso.para_entrega(entrega, titulo: titulo, cuerpo: cuerpo)
  end
end
