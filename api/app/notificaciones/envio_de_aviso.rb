# RF-37 Degradación ante fallo de entrega · CU-14 · RNF-11, RNF-12
# Prueba: CP-RF-37
#
# CU-14 (Tabla 13) · «La entrega queda registrada como entregada por acuse del cliente, o
# con causa de fallo y degradación a aviso en la aplicación.» Envía el aviso de una fila
# de entrega por push a las suscripciones vigentes de su destinatario y resuelve el
# resultado:
#   aceptado             canal push; el acuse se espera PoliticaDeEnvio::ESPERA_DE_ACUSE.
#   credencial inválida  la suscripción pasa a inválida y no se reintenta.
#   transitorio          se lanza ErrorTransitorio para que la cola reintente.
#   sin suscripción      falta de soporte del navegador: la fila queda en la aplicación.
# Toda degradación deja la fila en canal `aplicacion`, con su causa, y un registro en la
# bitácora técnica (RNF-07).
class EnvioDeAviso
  class ErrorTransitorio < StandardError
    attr_reader :codigo

    def initialize(codigo)
      @codigo = codigo
      super("el servicio de notificaciones no respondió (#{codigo})")
    end
  end

  def self.para_entrega(entrega, titulo:, cuerpo:)
    suscripciones = SuscripcionPush.vigentes.where(usuario_id: entrega.destinatario_id).to_a
    if suscripciones.empty?
      return degradar(entrega, "falta_de_soporte_del_navegador", "sin_suscripcion")
    end

    cliente = ClienteFcm.desde_el_entorno
    aceptadas, transitorios, invalidadas = 0, [], []

    suscripciones.each do |suscripcion|
      resultado = enviar(cliente, suscripcion, titulo, cuerpo)
      case resultado.estado
      when :aceptado then aceptadas += 1
      when :credencial_invalida
        suscripcion.invalidar!
        BitacoraEnvio.registrar!(causa: "credencial_invalida", codigo_proveedor: resultado.codigo,
                                 entrega: entrega, suscripcion: suscripcion)
        invalidadas << resultado.codigo
      else transitorios << resultado.codigo
      end
    end

    if aceptadas.positive?
      entrega.update!(canal: "push", causa_fallo: nil)
      VerificacionDeAcuseJob.set(wait: PoliticaDeEnvio::ESPERA_DE_ACUSE).perform_later(entrega.id)
    elsif transitorios.any?
      raise ErrorTransitorio, transitorios.first
    else
      entrega.update!(canal: "aplicacion", causa_fallo: "credencial_invalida")
    end
  end

  # RNF-11 · la indisponibilidad del servicio no impide operar: el aviso se entrega dentro
  # de la aplicación y la causa queda registrada.
  def self.degradar(entrega, causa, codigo, suscripcion: nil)
    entrega.update!(canal: "aplicacion", causa_fallo: causa)
    BitacoraEnvio.registrar!(causa: causa, codigo_proveedor: codigo, entrega: entrega, suscripcion: suscripcion)
  end

  # Un error inesperado del cliente cuenta como servicio no disponible: nunca propaga.
  def self.enviar(cliente, suscripcion, titulo, cuerpo)
    cliente.enviar(token: suscripcion.token, titulo: titulo, cuerpo: cuerpo)
  rescue StandardError => error
    ClienteFcm::Resultado.new(estado: :transitorio, codigo: error.class.name)
  end
  private_class_method :enviar
end
