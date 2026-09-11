# RF-04 Alta de alumnos y tutores · RF-05 · CU-05 · RN-01, RN-03, RN-05
# Prueba: CP-RF-04 · CP-RF-05
#
# Tabla 27 · POST /api/v1/alumnos/{id}/tutores · docente · «Vincular un tutor al alumno».
# Tabla 40 · petición: nombre, apellido, correo. Respuesta: recurso usuario, tutor_alumno
# y codigo_activacion, con el código en claro una sola vez (D-10).
class TutoresDeAlumnoController < ApplicationController
  # RN-03 · «El docente da de alta a los alumnos y tutores de sus cursos.»
  autoriza :crear, roles: %w[docente]

  # CU-05 pasos 2 y 3 · «registra hasta dos tutores del alumno …; el sistema genera el
  # código de activación de cada persona registrada».
  def crear
    alumno = alumno_de_sus_cursos

    resultado = ActiveRecord::Base.transaction do
      alta = RegistroDePersona.registrar(**datos_de_persona, rol: "tutor", registrado_por: usuario_actual)
      vinculacion = TutorAlumno.create!(tutor: alta.usuario, alumno: alumno,
                                        vigente_desde: Time.current.to_date)
      [ alta, vinculacion ]
    end
    alta, vinculacion = resultado

    render json: {
      usuario: alta.usuario.recurso,
      tutor_alumno: vinculacion.recurso,
      codigo_activacion: alta.codigo_activacion.representacion(codigo_en_claro: alta.codigo_en_claro)
    }, status: :created
  end

  private

  # CU-05 precondición · «el docente está vinculado al curso» del alumno. El alumno
  # inexistente, o ajeno a sus cursos, no es suyo: 403 como en la fila de la Tabla 35.
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

  def datos_de_persona
    p = params.permit(:nombre, :apellido, :correo)
    faltantes = %i[nombre apellido correo].select { |campo| p[campo].blank? }
    if faltantes.any?
      raise ErrorDeDominio::DatosInaceptables.new(detalle: "Faltan campos obligatorios: #{faltantes.join(', ')}.")
    end

    p.to_h.symbolize_keys
  end
end
