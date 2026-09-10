# Tabla 35 · Catálogo de errores de la interfaz de programación · Boundary 6
# El catálogo es cerrado: ningún rechazo de la interfaz emite un estado que la tabla
# no contemple. Cada excepción de este archivo corresponde a una fila de la Tabla 35 y
# se deriva de un flujo de excepción ya especificado en el punto 2.3.
#
# Prueba: CP-RNF-17
class ErrorDeDominio < StandardError
  # Los nueve estados de la Tabla 35 y ninguno más.
  CATALOGO = [ 401, 403, 404, 409, 410, 413, 415, 422, 500 ].freeze

  attr_reader :estado, :codigo, :regla, :detalle

  def initialize(estado:, codigo:, detalle:, regla: nil)
    unless CATALOGO.include?(estado)
      raise ArgumentError, "el estado #{estado} no pertenece al catálogo de la Tabla 35"
    end

    @estado  = estado
    @codigo  = codigo
    @regla   = regla
    @detalle = detalle
    super(detalle)
  end

  # 401 · Credencial inválida, cuenta dada de baja, token ausente, expirado o alterado
  # CU-01 E1 y E2 · RNF-02
  class NoAutenticado < ErrorDeDominio
    def initialize(codigo: "credencial_invalida", detalle: "Credenciales inválidas.")
      super(estado: 401, codigo:, detalle:)
    end
  end

  # 403 · Autenticado pero no habilitado
  # CU-01 A · CU-02 A · CU-06 E1 · CU-07 E1 · CU-08 E1 · CU-11 E1 · CU-12 E1 · CU-15 E1
  class NoHabilitado < ErrorDeDominio
    def initialize(codigo: "no_habilitado", detalle: "La operación no está habilitada para este usuario.")
      super(estado: 403, codigo:, detalle:)
    end
  end

  # 404 · Recurso ajeno a las vinculaciones de quien consulta · CU-09 E1
  class NoEncontrado < ErrorDeDominio
    def initialize(codigo: "no_encontrado", detalle: "El recurso no existe o no corresponde a sus vinculaciones.")
      super(estado: 404, codigo:, detalle:)
    end
  end

  # 409 · Conflicto con una regla de negocio del dominio, con el código de la regla
  # consignado · CU-03 E1 y E2 · CU-04 E1 · CU-05 E1, E2 y E3
  class ConflictoDeRegla < ErrorDeDominio
    def initialize(regla:, detalle:)
      super(estado: 409, codigo: "conflicto_de_regla", regla:, detalle:)
    end
  end

  # 410 · Código de activación vencido, ya utilizado o inexistente · CU-02 E1
  class CodigoNoVigente < ErrorDeDominio
    def initialize(detalle: "El código de activación no está vigente.")
      super(estado: 410, codigo: "codigo_no_vigente", detalle:)
    end
  end

  # 413 · Archivo adjunto que supera los 5 MB · RN-33
  class AdjuntoDemasiadoGrande < ErrorDeDominio
    def initialize(detalle: "El archivo supera el tamaño máximo admitido.")
      super(estado: 413, codigo: "adjunto_demasiado_grande", regla: "RN-33", detalle:)
    end
  end

  # 415 · Archivo adjunto en un formato distinto de PDF · RN-33
  class FormatoNoAdmitido < ErrorDeDominio
    def initialize(detalle: "El formato del archivo no está admitido.")
      super(estado: 415, codigo: "formato_no_admitido", regla: "RN-33", detalle:)
    end
  end

  # 422 · Petición bien formada con datos inaceptables · RN-33 y validaciones de forma
  class DatosInaceptables < ErrorDeDominio
    def initialize(detalle: "La petición contiene datos inaceptables.", regla: nil)
      super(estado: 422, codigo: "datos_inaceptables", regla:, detalle:)
    end
  end
end
