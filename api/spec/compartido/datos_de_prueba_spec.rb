# Conjunto de datos de prueba · RNF-09 · Tabla 35, paso 4 · Boundary 8
# Prueba: CP-RNF-09
require "rails_helper"

# RNF-09 (Tabla 11) · «…sobre un conjunto de prueba equivalente a dos años lectivos del
# curso piloto: un año cerrado y uno vigente, 184 cuentas, 400 anuncios, 36.000 filas de
# entrega, 16.000 mensajes en cuatro conversaciones y 2.000 registros de bitácora de envío.»
# Tabla 35, paso 4 · «cargar el archivo de datos de prueba» → «el volumen [es] el declarado
# en RNF-09». Boundary 8 · sólo datos ficticios.
RSpec.describe DatosDePrueba do
  def cargar
    described_class.cargar
  end

  # Cargar el conjunto tarda unos diez segundos: los grupos que sólo lo consultan lo cargan
  # una vez y lo borran al terminar, fuera de la transacción de cada ejemplo. Los años
  # lectivos los crea el conjunto y no los borra (no puede saber si eran suyos): esta prueba,
  # que parte de una base vacía, sí los borra.
  def descargar
    described_class.borrar
    AnioLectivo.where(anio: [ 2025, 2026 ]).delete_all
  end

  describe "volumen declarado en RNF-09" do
    before(:all) { described_class.cargar }
    after(:all) { descargar }

    it "carga las 184 cuentas, 400 anuncios, 36.000 entregas, 16.000 mensajes y 2.000 registros de bitácora" do
      expect(Usuario.where("correo LIKE ?", "%@#{DatosDePrueba::DOMINIO}").count).to eq(184)
      expect(Anuncio.count).to eq(400)
      expect(EntregaAnuncio.count).to eq(36_000)
      expect(Mensaje.count).to eq(16_000)
      expect(BitacoraEnvio.count).to eq(2_000)
    end

    it "reparte los mensajes en cuatro conversaciones, cuatro mil en cada una" do
      por_conversacion = Mensaje.group(:conversacion_id).count.values

      expect(por_conversacion).to eq([ 4_000 ] * 4)
    end

    it "abarca dos años lectivos: uno cerrado y uno vigente" do
      anios = AnioLectivo.where(anio: [ 2025, 2026 ]).order(:anio).pluck(:anio, :estado)

      expect(anios).to eq([ [ 2025, "cerrado" ], [ 2026, "vigente" ] ])
    end

    it "reparte los roles: un directivo, tres docentes, 70 alumnos y 110 tutores" do
      roles = Usuario.where("correo LIKE ?", "%@#{DatosDePrueba::DOMINIO}").group(:rol).count

      expect(roles).to eq("directivo" => 1, "docente" => 3, "alumno" => 70, "tutor" => 110)
    end
  end

  # Boundary 8 · «Ningún dato real de personas o de la institución.»
  describe "sólo datos ficticios" do
    before(:all) { described_class.cargar }
    after(:all) { descargar }

    it "ninguna cuenta usa un dominio que no sea el reservado para pruebas" do
      correos = Usuario.pluck(:correo)

      expect(correos).to all(end_with("@#{DatosDePrueba::DOMINIO}"))
    end

    it "todas las cuentas comparten una credencial conocida y ninguna exige sustituirla" do
      cuenta = Usuario.find_by(rol: "tutor")

      expect(cuenta.contrasena_valida?(DatosDePrueba::CONTRASENA)).to be(true)
      expect(Usuario.where(credencial_provisional: true).count).to eq(0)
    end
  end

  # Los datos deben ser coherentes con las reglas, no sólo tener el volumen.
  describe "coherencia con las reglas del dominio" do
    before(:all) { described_class.cargar }
    after(:all) { descargar }

    it "cada anuncio tiene una versión, sus dos cursos y 90 destinatarios que son alumnos o tutores" do
      anuncio = Anuncio.first
      version = AnuncioVersion.find_by!(anuncio_id: anuncio.id)

      expect(AnuncioCurso.where(anuncio_id: anuncio.id).count).to eq(2)
      entregas = EntregaAnuncio.where(anuncio_version_id: version.id)
      expect(entregas.count).to eq(90)
      expect(Usuario.where(id: entregas.select(:destinatario_id)).pluck(:rol).uniq).to match_array(%w[alumno tutor])
    end

    it "las marcas respetan la monotonía: completan a las anteriores y nunca preceden al envío" do
      con_lectura = EntregaAnuncio.where.not(leida_en: nil)

      expect(con_lectura.where(vista_en: nil).or(con_lectura.where(entregada_en: nil))).to be_empty
      expect(EntregaAnuncio.where("vista_en < entregada_en OR leida_en < vista_en")).to be_empty
    end

    it "toda entrega en canal aplicación declara su causa, y ninguna en push la declara" do
      expect(EntregaAnuncio.where(canal: "aplicacion", causa_fallo: nil)).to be_empty
      expect(EntregaAnuncio.where.not(causa_fallo: nil).where(canal: "push")).to be_empty
    end

    it "cada registro de bitácora corresponde a una entrega con la misma causa" do
      discordantes = BitacoraEnvio.joins("JOIN entrega_anuncio e ON e.id = bitacora_envio.entrega_anuncio_id")
                                  .where("e.causa_fallo <> bitacora_envio.causa")

      expect(discordantes).to be_empty
    end

    it "los mensajes los escriben quienes integran el canal del curso" do
      integrantes = Participante.pluck(:conversacion_id, :usuario_id).to_set

      ajenos = Mensaje.pluck(:conversacion_id, :autor_id).uniq.reject { |par| integrantes.include?(par) }

      expect(ajenos).to be_empty
    end

    it "el año cerrado tiene sus canales en solo lectura y sus vinculaciones terminadas" do
      cerrado = AnioLectivo.find_by!(anio: 2025)
      cursos = Curso.where(anio_lectivo_id: cerrado.id)

      expect(Conversacion.where(curso_id: cursos.select(:id)).pluck(:estado).uniq).to eq([ "solo_lectura" ])
      expect(AlumnoCurso.where(curso_id: cursos.select(:id), vigente_hasta: nil)).to be_empty
    end

    it "en el año vigente los docentes y alumnos están vinculados hoy" do
      vigente = Curso.where(anio_lectivo_id: AnioLectivo.find_by!(anio: 2026).id)

      expect(DocenteCurso.vigentes.where(curso_id: vigente.select(:id)).where(es_titular: true).count).to eq(2)
      expect(AlumnoCurso.vigentes.where(curso_id: vigente.select(:id)).count).to eq(35)
    end
  end

  # La tarea se corre las veces que haga falta: recarga sin duplicar y sin tocar lo ajeno.
  describe "reejecución" do
    it "recarga sin duplicar, y borrarla no toca los datos que no son del conjunto" do
      ajeno = create(:usuario, :docente)
      # Un año cerrado ajeno: el vigente lo crea el conjunto, y sólo puede haber uno (RN-31).
      curso = create(:curso, anio_lectivo: create(:anio_lectivo, anio: 2020, estado: "cerrado"))

      cargar
      cargar

      expect(Usuario.where("correo LIKE ?", "%@#{DatosDePrueba::DOMINIO}").count).to eq(184)
      expect(EntregaAnuncio.count).to eq(36_000)
      expect(Anuncio.count).to eq(400)

      described_class.borrar

      expect(Usuario.exists?(ajeno.id)).to be(true)
      expect(Curso.exists?(curso.id)).to be(true)
      expect(Usuario.where("correo LIKE ?", "%@#{DatosDePrueba::DOMINIO}")).to be_empty
      expect(Anuncio.count).to eq(0)
    end
  end

  # RN-31 · un solo año lectivo vigente: el conjunto no cierra el de otra persona.
  describe "año vigente ajeno" do
    it "se niega con un mensaje claro y no carga nada" do
      create(:anio_lectivo, anio: 2031, estado: "vigente")

      expect { cargar }.to raise_error(ArgumentError, /Ya hay un año lectivo vigente \(2031\)/)
      expect(Usuario.where("correo LIKE ?", "%@#{DatosDePrueba::DOMINIO}")).to be_empty
      expect(AnioLectivo.find_by!(anio: 2031).estado).to eq("vigente")
    end
  end
end
