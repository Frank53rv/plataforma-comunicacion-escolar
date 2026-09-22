# RF-04 Alta de alumnos y tutores · RF-05 · RF-14 · CU-05 · RN-01, RN-03, RN-05, RN-29
# Prueba: CP-RF-04 · CP-RF-05 · CP-RF-14
#
# Tabla 27 · POST /api/v1/alumnos/{id}/tutores · docente · «Vincular un tutor al alumno».
# Tabla 40 · petición: nombre, apellido, correo. Respuesta: recurso usuario, tutor_alumno
# y codigo_activacion, con el código en claro una sola vez.
class TutoresDeAlumnoController < ApplicationController
  # RN-03 · «El docente da de alta a los alumnos y tutores de sus cursos.»
  autoriza :crear, roles: %w[docente]

  # RF-14 · registra hasta dos tutores del alumno, o vincula tutores ya existentes en
  # el sistema; RF-05 genera el código de activación de cada persona registrada.
  def crear
    alumno = alumno_de_sus_cursos
    datos = datos_de_persona

    tutor, vinculacion, alta = ActiveRecord::Base.transaction do
      # El bloqueo del alumno serializa dos vinculaciones simultáneas: sin él, ambas
      # podrían contar dos tutores y vincular un tercero, contra RN-29.
      alumno.lock!
      TutorAlumno.verificar_limite!(alumno)

      existente = tutor_existente(datos[:correo], alumno)
      alta = existente ? nil : RegistroDePersona.registrar(**datos, rol: "tutor", registrado_por: usuario_actual)
      tutor = existente || alta.usuario

      [ tutor, TutorAlumno.create!(tutor: tutor, alumno: alumno, vigente_desde: Time.current.to_date), alta ]
    end

    # RF-05 · el código se genera para cada persona registrada. El tutor que ya existía
    # no es una persona registrada en este acto: conserva su cuenta y no recibe un
    # código nuevo (RF-14 · «bajo una única cuenta»).
    codigo = alta&.codigo_activacion&.representacion(codigo_en_claro: alta.codigo_en_claro)

    render json: {
      usuario: tutor.recurso,
      tutor_alumno: vinculacion.recurso,
      codigo_activacion: codigo
    }, status: :created
  end

  private

  # CU-05 (Tabla 13) precondición: el docente está vinculado al curso del alumno. El
  # alumno inexistente, o ajeno a sus cursos, no es suyo: 403 como en la fila de la
  # Tabla 24.
  def alumno_de_sus_cursos
    alumno = Usuario.find_by(id: params[:id], rol: "alumno")
    unless alumno && usuario_actual.alumnos_de_sus_cursos.exists?(usuario_id: alumno.id)
      raise ErrorDeDominio::NoHabilitado.new(
        codigo: "docente_no_vinculado_al_curso",
        detalle: "El alumno no pertenece a ninguno de sus cursos."
      )
    end

    # RN-11 · la baja revoca el acceso: no se le vinculan tutores.
    if alumno.estado_dado_de_baja?
      raise ErrorDeDominio::DatosInaceptables.new(detalle: "El alumno fue dado de baja.")
    end

    alumno
  end

  # RF-14 · un mismo tutor con varios hijos, aun en cursos distintos, opera con una
  # sola cuenta y sin perfiles separados. Se lo identifica por su correo, único según
  # la Tabla 21. El correo de una persona con otro rol no es el de un tutor (RN-04) y
  # sigue siendo un dato repetido.
  def tutor_existente(correo, alumno)
    persona = Usuario.find_by(correo: correo)
    return if persona.nil?

    if !persona.tutor? || persona.estado_dado_de_baja?
      raise ErrorDeDominio::DatosInaceptables.new(detalle: "El correo indicado no puede vincularse como tutor.")
    end

    # Tabla 21 · «Par único entre los vigentes»
    if TutorAlumno.vigentes.exists?(tutor_id: persona.id, alumno_id: alumno.id)
      raise ErrorDeDominio::DatosInaceptables.new(detalle: "El tutor ya está vinculado a este alumno.")
    end

    persona
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
