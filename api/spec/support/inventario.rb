# Tabla 18 · Inventario de endpoints. La columna «Roles autorizados» es el insumo
# directo de RNF-01: «la matriz de pruebas de autorización se construye como el producto
# de esta columna por los cuatro roles».
#
# La columna se escribe en prosa y contiene calificativos que restringen DENTRO del rol
# —«docente autor», «docente titular»— o por pertenencia —«participantes de la
# conversación»—. Para la matriz de RNF-01 lo que importa es qué rol puede llegar a
# pasar: los calificativos se verifican después, en el caso de uso que los declara.
module Inventario
  ROLES = %w[directivo docente tutor alumno].freeze

  # Lectura literal de cada variante de la columna, con su texto de origen.
  EQUIVALENCIAS = {
    "sin autenticar" => :sin_autenticar,
    "directivo" => %w[directivo],
    "docente" => %w[docente],
    "tutor" => %w[tutor],
    "alumno" => %w[alumno],
    # «Docente autor»: el rol es docente; que sea el autor lo verifica CU-07 E1,
    # CU-08 E1 y CU-11 E1 con 403.
    "docente autor" => %w[docente],
    # «Directivo, docente titular»: la titularidad la verifica RN-10.
    "docente titular" => %w[docente],
    # «Directivo (docentes), docente (alumnos y tutores)»: la cadena de RN-07.
    "directivo (docentes)" => %w[directivo],
    # «Directivo (todos los cursos), docente (cursos con vinculación vigente)»: el alcance
    # sobre los cursos lo verifica la consulta de CU-09, no la matriz de roles.
    "directivo (todos los cursos)" => %w[directivo],
    "docente (cursos con vinculación vigente)" => %w[docente],
    "docente (alumnos" => %w[docente],
    "tutores)" => [],
    # «Participantes de la conversación»: la participación deriva de la vinculación con
    # el curso (Tabla 14, entidad participante). El directivo no es participante; su
    # acceso de supervisión es un requisito Should have, fuera del alcance comprometido.
    "participantes de la conversación" => %w[docente tutor alumno]
  }.freeze

  # El paquete normativo vive fuera de api/. Dentro del contenedor se monta en /specs;
  # fuera, es la carpeta hermana del repositorio.
  PAQUETE = [ Pathname.new("/specs"), Rails.root.join("../specs") ].find(&:directory?)

  module_function

  def operaciones
    @operaciones ||= JSON.parse(PAQUETE.join("20-endpoints.json").read)["endpoints"]
  end

  # Roles de los cuatro que la Tabla 18 habilita para la operación.
  def roles_de(endpoint)
    valores = endpoint["roles"].map { |r| EQUIVALENCIAS.fetch(r.strip.downcase) }
    return :sin_autenticar if valores.include?(:sin_autenticar)

    valores.flatten.uniq
  end

  # Operaciones de la Tabla 18 que ya están expuestas en el enrutador.
  def construidas
    operaciones.reject { |e| e["metodo"] == "WSS" }.filter_map do |e|
      ruta = e["ruta"]
      reconocida = Rails.application.routes.recognize_path(
        ruta.gsub(/\{[^}]+\}/, SecureRandom.uuid), method: e["metodo"]
      )
      e.merge("controlador" => reconocida[:controller], "accion" => reconocida[:action])
    rescue ActionController::RoutingError
      nil
    end
  end

  # Una ruta concreta, con los parámetros sustituidos por identificadores válidos.
  def ruta_concreta(endpoint)
    endpoint["ruta"].gsub(/\{[^}]+\}/) { SecureRandom.uuid }
  end
end
