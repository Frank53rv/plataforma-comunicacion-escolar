# RF-40 Paneles diferenciados por rol · CU-09 · RN-04, RN-15
# Prueba: CP-RF-40
#
# RF-40 (Tabla 10) · paneles «con las funciones correspondientes al rol… sin exponer
# opciones ajenas a él». Tabla 29 · GET /paneles/me → «rol, nombre, opciones habilitadas y
# cantidad de anuncios sin leer».
#
# Las opciones se DERIVAN de lo que cada controlador declara con `autoriza`, que son
# literalmente los roles de la Tabla 18: el panel no es una segunda lista de permisos, y si
# una operación cambia de roles el panel se entera solo. Además, una opción que la interfaz
# sabe que estará vacía para esa persona no se declara. La autorización sigue resolviéndose
# operación por operación (RNF-21): el panel sólo le dice al cliente qué dibujar.
class PanelDelUsuario
  # Cada opción del panel, con la operación principal que la sostiene («controlador#acción»).
  # El orden es el de presentación: la bandeja de anuncios va primera (RF-39).
  SECCIONES = {
    "anuncios" => "anuncios#index",
    "publicar_anuncio" => "anuncios#crear",
    "constancias" => "anuncios#constancias",
    "conversaciones" => "conversaciones#index",
    "preferencias" => "preferencias#mostrar",
    "supervision" => "supervision#cursos",
    "anios_lectivos" => "anios_lectivos#index",
    "cursos" => "cursos#index",
    "docentes" => "docentes#crear",
    "alumnos" => "alumnos#destruir",
    # No es una sección de navegación sino una capacidad: la alta de alumnos y de tutores es del
    # docente (Tabla 18), y el cliente sólo dibuja esos formularios si la interfaz la habilitó.
    "altas_de_alumnos_y_tutores" => "alumnos#crear"
  }.freeze

  def self.para(usuario)
    new(usuario).recurso
  end

  def initialize(usuario)
    @usuario = usuario
  end

  def recurso
    { "rol" => @usuario.rol, "nombre" => @usuario.nombre, "opciones_habilitadas" => opciones,
      "anuncios_sin_leer" => anuncios_sin_leer, "cursos" => cursos }
  end

  private

  def opciones
    SECCIONES.select { |seccion, operacion| habilitada?(seccion, operacion) }.keys
  end

  def habilitada?(seccion, operacion)
    controlador, accion = operacion.split("#")
    roles = "#{controlador.camelize}Controller".constantize.roles_declarados_para(accion)
    return false unless Array(roles).map(&:to_s).include?(@usuario.rol)

    # El canal grupal es de docentes y tutores con curso vinculado (RF-25). El alumno lo
    # tiene autorizado pero recibe la colección vacía (RF-24 no se construye): mostrarle la
    # opción sería exponerle una función que no tiene.
    seccion != "conversaciones" || Conversacion.del_usuario(@usuario).exists?
  end

  # Publicaciones dirigidas a la persona cuya lectura no está registrada. Las eliminadas no
  # cuentan: dejaron de estar en su historial.
  def anuncios_sin_leer
    EntregaAnuncio.where(destinatario_id: @usuario.id, leida_en: nil)
                  .joins("JOIN anuncio_version v ON v.id = entrega_anuncio.anuncio_version_id " \
                         "JOIN anuncio a ON a.id = v.anuncio_id")
                  .where("a.estado <> 'eliminado'").count
  end

  # Los cursos con que la persona filtra su historial (RF-22): los de su vínculo vigente.
  def cursos
    Curso.where(id: ids_de_cursos).order(:nombre).pluck(:id, :nombre)
         .map { |id, nombre| { "id" => id, "nombre" => nombre } }
  end

  def ids_de_cursos
    case @usuario.rol
    when "directivo" then Curso.where(anio_lectivo_id: AnioLectivo.where(estado: "vigente").select(:id)).select(:id)
    when "docente" then @usuario.cursos_vigentes_como_docente
    when "tutor" then Conversacion.cursos_de_los_alumnos_de(@usuario)
    else AlumnoCurso.vigentes.where(usuario_id: @usuario.id).select(:curso_id)
    end
  end
end
