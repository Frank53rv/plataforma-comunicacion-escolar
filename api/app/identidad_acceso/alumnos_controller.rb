# RF-04 Alta de alumnos y tutores · RF-05 · RF-13 · CU-05 · RN-01, RN-03, RN-05, RN-30
# Prueba: CP-RF-04 · CP-RF-05 · CP-RF-13
#
# Tabla 27 · POST /api/v1/alumnos · docente · «Dar de alta a un alumno y vincularlo a
# un curso».
# Tabla 40 · petición: nombre, apellido, correo, curso_id. Respuesta: recurso usuario,
# alumno_curso y codigo_activacion, con el código en claro una sola vez (D-10).
class AlumnosController < ApplicationController
  # RN-03 · «El docente da de alta a los alumnos y tutores de sus cursos.»
  autoriza :crear, roles: %w[docente]

  # CU-05 pasos 1 y 3 · «el docente registra al alumno y lo vincula a uno de sus
  # cursos; el sistema genera el código de activación de cada persona registrada».
  def crear
    curso = curso_del_docente

    # CU-05 E2 · «se rechaza la vinculación de un alumno a un segundo curso vigente
    # dentro del mismo año lectivo». El alumno se identifica por su correo, que la Tabla
    # 21 declara único; la regla se verifica antes que la unicidad del correo, para que
    # el rechazo sea el de la regla y no el del dato repetido.
    existente = Usuario.find_by(correo: datos_de_persona[:correo], rol: "alumno")
    AlumnoCurso.verificar_pertenencia_unica!(alumno_id: existente.id, curso: curso) if existente

    # Quality Spec · persona, código y vinculación en una transacción: todo o nada.
    resultado = ActiveRecord::Base.transaction do
      alta = RegistroDePersona.registrar(**datos_de_persona, rol: "alumno", registrado_por: usuario_actual)
      vinculacion = AlumnoCurso.create!(alumno: alta.usuario, curso: curso,
                                        vigente_desde: Time.current.to_date)
      [ alta, vinculacion ]
    end
    alta, vinculacion = resultado

    render json: {
      usuario: alta.usuario.recurso,
      alumno_curso: vinculacion.recurso,
      codigo_activacion: alta.codigo_activacion.representacion(codigo_en_claro: alta.codigo_en_claro)
    }, status: :created
  end

  private

  # CU-05 precondición · «el docente está vinculado al curso». La Tabla 35 pone «docente
  # no vinculado al curso» en la fila del 403. Un curso inexistente tampoco es suyo.
  def curso_del_docente
    curso_id = params.require(:curso_id)
    unless usuario_actual.dicta_curso?(curso_id)
      raise ErrorDeDominio::NoHabilitado.new(
        codigo: "docente_no_vinculado_al_curso",
        detalle: "No está vinculado al curso indicado."
      )
    end

    curso = Curso.find(curso_id)
    # El alumno se vincula a «un curso del año lectivo vigente».
    unless curso.anio_lectivo.estado_vigente?
      raise ErrorDeDominio::DatosInaceptables.new(detalle: "El curso no pertenece al año lectivo vigente.")
    end

    curso
  end

  def datos_de_persona
    p = params.permit(:nombre, :apellido, :correo)
    faltantes = %i[nombre apellido correo].select { |campo| p[campo].blank? }
    if faltantes.any?
      raise ErrorDeDominio::DatosInaceptables.new(detalle: "Faltan campos obligatorios: #{faltantes.join(', ')}.")
    end

    p.to_h.symbolize_keys
  end
end
