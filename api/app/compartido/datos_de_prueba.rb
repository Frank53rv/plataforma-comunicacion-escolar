# Conjunto de datos de prueba · RNF-09 · Tabla 35, paso 4 · Boundary 8
# Prueba: CP-RNF-09
#
# RNF-09 (Tabla 11) · el tiempo de respuesta de las consultas se mide «sobre un conjunto de
# prueba equivalente a dos años lectivos del curso piloto: un año cerrado y uno vigente, 184
# cuentas, 400 anuncios, 36.000 filas de entrega, 16.000 mensajes en cuatro conversaciones y
# 2.000 registros de bitácora de envío».
# Tabla 35, paso 4 · «cargar el archivo de datos de prueba», con «el volumen declarado en
# RNF-09».
# Boundary 8 · «Ningún dato real de personas o de la institución»: nombres combinados de
# listas ficticias y correos bajo un dominio reservado para pruebas.
#
# El reparto que produce el volumen exacto: 1 directivo, 3 docentes, 70 alumnos y 110
# tutores (184 cuentas). Cada año lectivo tiene dos cursos, 35 alumnos y 55 tutores, es
# decir 90 destinatarios por anuncio; 200 anuncios por año dan 400 y 36.000 entregas.
#
# Se carga por lotes y es reejecutable: borra lo que él mismo creó y lo vuelve a crear,
# sin tocar ningún dato que no sea suyo (lo reconoce por el dominio de los correos).
class DatosDePrueba
  DOMINIO = "datos-de-prueba.test".freeze
  CONTRASENA = "prueba-2026".freeze
  ZONA = "America/Asuncion".freeze
  LOTE = 5_000
  SEMILLA = 20_260_921

  NOMBRES = %w[Ana Luis Marta Carlos Lucía Jorge Sofía Diego Elena Pablo Rosa Andrés Julia Mateo Carmen
               Raúl Paula Tomás Irene Hugo Noemí Bruno Silvia Óscar Clara Felipe Nora Iván Lidia Rubén
               Alba Martín Inés Gael Olga Nicolás Mabel Ramiro Celia Ismael].freeze
  APELLIDOS = %w[Acosta Benítez Cabrera Domínguez Escobar Franco Giménez Herrera Ibarra Jara Kunz
                 López Machado Núñez Ortiz Paredes Quiroga Ramos Sosa Torres Urbieta Vera Wagner Yegros
                 Zárate Aquino Báez Cardozo Duarte Espínola Fleitas Gómez Insaurralde Lezcano Maidana
                 Notario Ojeda Portillo Riveros Samaniego Trinidad].freeze
  TITULOS = [ "Reunión de padres", "Cambio de horario", "Salida pedagógica", "Entrega de boletines",
             "Feria de ciencias", "Acto cívico", "Recordatorio de materiales", "Jornada deportiva",
             "Cierre de trimestre", "Uniforme de gala" ].freeze
  MENSAJES = [ "¿Hay clases mañana?", "Gracias por el aviso.", "¿A qué hora es la actividad?",
              "Confirmo la asistencia.", "Mañana llevamos los materiales.", "Recibido, muchas gracias.",
              "¿Se puede entregar el trabajo el lunes?", "Buenos días, una consulta.",
              "Adjunto no es posible, lo explico por acá.", "Quedo atento a novedades." ].freeze

  ANIOS = [
    { anio: 2025, estado: "cerrado", abierto: [ 2025, 2, 17 ], cerrado: [ 2025, 12, 12 ],
      desde: [ 2025, 3, 3 ], hasta: [ 2025, 11, 28 ] },
    { anio: 2026, estado: "vigente", abierto: [ 2026, 2, 16 ], cerrado: nil,
      desde: [ 2026, 3, 2 ], hasta: [ 2026, 9, 18 ] }
  ].freeze

  ANUNCIOS_POR_ANIO = 200
  MENSAJES_POR_CONVERSACION = 4_000
  BITACORA = 2_000

  def self.cargar
    new.cargar
  end

  def self.borrar
    new.borrar
  end

  def cargar
    ActiveRecord::Base.transaction do
      borrar
      @azar = Random.new(SEMILLA)
      @zona = ActiveSupport::TimeZone[ZONA]
      @contrasena_hash = BCrypt::Password.create(CONTRASENA).to_s
      @correos = 0

      directivo = cuenta("directivo")
      docentes = { 2025 => [ cuenta("docente") ], 2026 => [ cuenta("docente"), cuenta("docente") ] }
      anios = ANIOS.map { |datos| [ datos[:anio], cargar_anio(datos, docentes.fetch(datos[:anio])) ] }.to_h
      insertar(Usuario, [ directivo ] + docentes.values.flatten + anios.values.flat_map { |a| a[:personas] })

      anios.each_value { |anio| vincular(anio) }
      entregas = anios.values.flat_map { |anio| publicar(anio) }
      insertar(EntregaAnuncio, entregas.map { |e| e.slice(*COLUMNAS_ENTREGA) })
      registrar_bitacora(entregas, anios.fetch(2026))
      anios.each_value { |anio| conversar(anio) }
      actualizar_estadisticas
    end
    resumen
  end

  # Borra sólo lo que este conjunto creó. Se reconoce por el dominio de los correos.
  def borrar
    usuarios = Usuario.where("correo LIKE ?", "%@#{DOMINIO}")
    ids = usuarios.pluck(:id)
    return if ids.empty?

    curso_ids = (DocenteCurso.where(usuario_id: ids).pluck(:curso_id) +
                 AlumnoCurso.where(usuario_id: ids).pluck(:curso_id)).uniq
    conversacion_ids = Conversacion.where(curso_id: curso_ids).pluck(:id)
    anuncio_ids = Anuncio.where(autor_id: ids).pluck(:id)
    version_ids = AnuncioVersion.where(anuncio_id: anuncio_ids).pluck(:id)

    # Con identificadores en lugar de subconsultas anidadas: tras una carga masiva las
    # estadísticas del planificador están vacías y las subconsultas sobre decenas de miles
    # de filas se resuelven con bucles anidados, que tardan minutos.
    entregas = EntregaAnuncio.where(anuncio_version_id: version_ids)
    BitacoraEnvio.where(id: BitacoraEnvio.joins("JOIN entrega_anuncio e ON e.id = bitacora_envio.entrega_anuncio_id")
                                          .where(e: { anuncio_version_id: version_ids }).select(:id)).delete_all
    entregas.delete_all
    AnuncioCurso.where(anuncio_id: anuncio_ids).delete_all
    AnuncioVersion.where(id: version_ids).delete_all
    Anuncio.where(id: anuncio_ids).delete_all
    Mensaje.where(conversacion_id: conversacion_ids).delete_all
    Participante.where(conversacion_id: conversacion_ids).delete_all
    Conversacion.where(id: conversacion_ids).delete_all
    DocenteCurso.where(curso_id: curso_ids).delete_all
    AlumnoCurso.where(curso_id: curso_ids).delete_all
    TutorAlumno.where(alumno_id: ids).or(TutorAlumno.where(tutor_id: ids)).delete_all
    Curso.where(id: curso_ids).delete_all
    usuarios.delete_all
  end

  private

  COLUMNAS_ENTREGA = %i[id anuncio_version_id canal causa_fallo destinatario_id entregada_en enviada_en
                        leida_en vista_en].freeze

  # Tras una carga masiva el planificador no conoce el tamaño de las tablas. Sin esto las
  # consultas —y la medición de RNF-09, que se hace sobre este conjunto— salen con planes
  # pensados para tablas vacías.
  def actualizar_estadisticas
    tablas = [ Usuario, Curso, DocenteCurso, AlumnoCurso, TutorAlumno, Anuncio, AnuncioVersion, AnuncioCurso,
               EntregaAnuncio, Conversacion, Participante, Mensaje, BitacoraEnvio ].map(&:table_name)
    ActiveRecord::Base.connection.execute("ANALYZE #{tablas.map { |t| ActiveRecord::Base.connection.quote_table_name(t) }.join(', ')}")
  end

  def resumen
    { cuentas: Usuario.where("correo LIKE ?", "%@#{DOMINIO}").count, anuncios: Anuncio.count,
      entregas: EntregaAnuncio.count, mensajes: Mensaje.count, bitacora: BitacoraEnvio.count }
  end

  # --- personas ---

  def cuenta(rol)
    nombre = NOMBRES.fetch(@azar.rand(NOMBRES.size))
    apellido = APELLIDOS.fetch(@azar.rand(APELLIDOS.size))
    @correos += 1
    correo = "#{I18n.transliterate("#{nombre}.#{apellido}").downcase}.#{@correos}@#{DOMINIO}"
    { id: SecureRandom.uuid, nombre: nombre, apellido: apellido, correo: correo, rol: rol,
      estado: "activo", contrasena_hash: @contrasena_hash, credencial_provisional: false,
      creado_en: @zona.local(2025, 2, 10).utc }
  end

  # --- estructura académica de un año ---

  def cargar_anio(datos, docentes)
    anio = AnioLectivo.find_by(anio: datos[:anio]) || crear_anio(datos)
    cursos = %w[A B].map do |letra|
      Curso.create!(anio_lectivo: anio, nombre: "Primero #{letra}", turno: "mañana",
                    estado: datos[:estado] == "cerrado" ? "archivado" : "vigente")
    end
    alumnos = Array.new(35) { cuenta("alumno") }
    # 20 alumnos con dos tutores y 15 con uno: 55 tutores por año.
    tutores = alumnos.each_with_index.flat_map { |alumno, i| Array.new(i < 20 ? 2 : 1) { [ alumno, cuenta("tutor") ] } }

    { datos: datos, anio: anio, cursos: cursos, docentes: docentes, alumnos: alumnos,
      tutores: tutores, personas: alumnos + tutores.map(&:last),
      dias: dias_habiles(datos[:desde], datos[:hasta]) }
  end

  # RN-31 · existe un solo año lectivo vigente. Si ya hay otro, no es del conjunto de prueba
  # y no se cierra por su cuenta: se informa y no se carga nada.
  def crear_anio(datos)
    ajeno = datos[:estado] == "vigente" && AnioLectivo.estado_vigente.first
    if ajeno
      raise ArgumentError, "Ya hay un año lectivo vigente (#{ajeno.anio}) y sólo puede haber uno: el conjunto " \
                           "de prueba necesita que el vigente sea #{datos[:anio]}. No se cerró ni se cargó nada."
    end

    AnioLectivo.create!(anio: datos[:anio], estado: datos[:estado], abierto_en: @zona.local(*datos[:abierto]).utc,
                        cerrado_en: datos[:cerrado] && @zona.local(*datos[:cerrado]).utc)
  end

  def vincular(anio)
    desde = Date.new(*anio[:datos][:abierto])
    hasta = anio[:datos][:cerrado] && Date.new(*anio[:datos][:cerrado])
    cursos = anio[:cursos]

    insertar(DocenteCurso, anio[:docentes].each_with_index.flat_map do |docente, i|
      cursos.map do |curso|
        { curso_id: curso.id, usuario_id: docente.fetch(:id), es_titular: i.zero?, vigente_desde: desde,
          vigente_hasta: hasta }
      end
    end)
    insertar(AlumnoCurso, anio[:alumnos].each_with_index.map do |alumno, i|
      { curso_id: cursos.fetch(i < 18 ? 0 : 1).id, usuario_id: alumno.fetch(:id), vigente_desde: desde,
        vigente_hasta: hasta }
    end)
    insertar(TutorAlumno, anio[:tutores].map do |alumno, tutor|
      { alumno_id: alumno.fetch(:id), tutor_id: tutor.fetch(:id), vigente_desde: desde, vigente_hasta: hasta }
    end)
  end

  # --- anuncios y entregas ---

  def publicar(anio)
    docentes = anio[:docentes]
    destinatarios = anio[:personas].map { |persona| persona.fetch(:id) }
    anuncios = []
    versiones = []
    entregas = []

    ANUNCIOS_POR_ANIO.times do |i|
      publicado = momento(anio[:dias], i, ANUNCIOS_POR_ANIO)
      autor = docentes.fetch(i % 5 == 4 ? docentes.size - 1 : 0)
      anuncio_id = SecureRandom.uuid
      version_id = SecureRandom.uuid
      anuncios << { id: anuncio_id, autor_id: autor.fetch(:id), estado: "publicado", creado_en: publicado,
                    programado_para: nil, eliminado_en: nil, eliminado_por: nil }
      versiones << { id: version_id, anuncio_id: anuncio_id, numero_version: 1, titulo: titulo(i),
                     cuerpo: cuerpo(i), publicado_en: publicado }
      destinatarios.each { |destinatario| entregas << entrega(version_id, destinatario, publicado) }
    end

    insertar(Anuncio, anuncios)
    insertar(AnuncioVersion, versiones)
    insertar(AnuncioCurso, anuncios.flat_map do |a|
      anio[:cursos].map { |curso| { anuncio_id: a.fetch(:id), curso_id: curso.id } }
    end)
    entregas
  end

  # Cada fila se genera con los estados que el motor produce: quien lee ya vio y ya acusó
  # (RN-32), y la falta de acuse degrada el aviso a la aplicación con su causa (RF-37).
  def entrega(version_id, destinatario, enviada)
    fila = { id: SecureRandom.uuid, anuncio_version_id: version_id, destinatario_id: destinatario,
             enviada_en: enviada, entregada_en: nil, vista_en: nil, leida_en: nil, canal: "push",
             causa_fallo: nil }
    sorteo = @azar.rand
    return sin_acuse(fila) if sorteo >= 0.90

    fila[:entregada_en] = enviada + @azar.rand(5..900).seconds
    fila[:vista_en] = fila[:entregada_en] + @azar.rand(30..7_200).seconds if sorteo < 0.82
    fila[:leida_en] = fila[:vista_en] + @azar.rand(10..86_400).seconds if sorteo < 0.70
    return fila unless @azar.rand < 0.10

    fila.merge(canal: "aplicacion",
               causa_fallo: @azar.rand < 0.7 ? "falta_de_soporte_del_navegador" : "credencial_invalida")
  end

  def sin_acuse(fila)
    fila.merge(canal: "aplicacion",
               causa_fallo: @azar.rand < 0.75 ? "ausencia_de_acuse_del_cliente" : "indisponibilidad_del_servicio_push")
  end

  # Sólo del año vigente: la bitácora se conserva doce meses (RNF-07) y la purga diaria
  # borraría los registros del año cerrado apenas los cumpliera.
  CODIGOS = { "ausencia_de_acuse_del_cliente" => "sin_acuse", "indisponibilidad_del_servicio_push" => "503",
              "falta_de_soporte_del_navegador" => "sin_suscripcion", "credencial_invalida" => "UNREGISTERED" }.freeze

  def registrar_bitacora(entregas, anio)
    versiones = AnuncioVersion.where(anuncio_id: Anuncio.where(autor_id: anio[:docentes].map { |d| d.fetch(:id) }).select(:id))
                              .pluck(:id).to_set
    candidatas = entregas.select { |e| e[:causa_fallo] && versiones.include?(e[:anuncio_version_id]) }
    elegidas = candidatas.sample(BITACORA, random: @azar)
    insertar(BitacoraEnvio, elegidas.map do |e|
      espera = e[:causa_fallo] == "ausencia_de_acuse_del_cliente" ? PoliticaDeEnvio::ESPERA_DE_ACUSE : 0.seconds
      { causa: e[:causa_fallo], codigo_proveedor: CODIGOS.fetch(e[:causa_fallo]), entrega_anuncio_id: e[:id],
        suscripcion_id: nil, ocurrido_en: e[:enviada_en] + espera }
    end)
  end

  # --- conversaciones ---

  def conversar(anio)
    integrantes_docentes = anio[:docentes]
    estado = anio[:datos][:estado] == "cerrado" ? "solo_lectura" : "activa"
    incorporado = @zona.local(*anio[:datos][:abierto]).utc

    anio[:cursos].each_with_index do |curso, indice|
      canal = Conversacion.find_by!(curso_id: curso.id)
      canal.update!(estado: estado)
      alumnos = anio[:alumnos].each_slice(18).to_a.fetch(indice)
      tutores = anio[:tutores].select { |alumno, _| alumnos.include?(alumno) }.map { |_, tutor| tutor }
      autores = integrantes_docentes + tutores

      insertar(Participante, autores.map { |a| { conversacion_id: canal.id, usuario_id: a.fetch(:id), incorporado_en: incorporado } })
      insertar(Mensaje, Array.new(MENSAJES_POR_CONVERSACION) do |k|
        autor = @azar.rand < 0.35 ? integrantes_docentes.first : tutores.fetch(@azar.rand(tutores.size))
        { conversacion_id: canal.id, autor_id: autor.fetch(:id), cuerpo: "#{MENSAJES.fetch(k % MENSAJES.size)} (#{k + 1})",
          enviado_en: momento(anio[:dias], k, MENSAJES_POR_CONVERSACION, entre: 7..21) }
      end)
    end
  end

  # --- utilidades ---

  def dias_habiles(desde, hasta)
    (Date.new(*desde)..Date.new(*hasta)).reject { |dia| dia.saturday? || dia.sunday? }
  end

  # El i-ésimo de `total` instantes, repartidos en orden a lo largo de los días hábiles.
  def momento(dias, indice, total, entre: 8..17)
    dia = dias.fetch(indice * dias.size / total)
    @zona.local(dia.year, dia.month, dia.day, @azar.rand(entre), @azar.rand(60)).utc
  end

  def titulo(indice)
    "#{TITULOS.fetch(indice % TITULOS.size)} · #{indice + 1}"
  end

  def cuerpo(indice)
    "Se comunica a las familias y a los alumnos la novedad número #{indice + 1}. " \
      "Quienes tengan consultas pueden escribir por el canal grupal del curso."
  end

  def insertar(modelo, filas)
    filas.each_slice(LOTE) { |lote| modelo.insert_all!(lote) }
  end
end
