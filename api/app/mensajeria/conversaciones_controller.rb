# RF-25 Canal grupal del curso · CU-12 · RN-23
# Prueba: CP-RF-25
#
# Tabla 18 · GET /api/v1/cursos/{id}/conversaciones · docente, tutor, alumno · «Obtener
# los canales del curso que corresponden al rol». GET /api/v1/conversaciones · docente,
# tutor, alumno · «Consultar las conversaciones del usuario».
# Tabla 29 · canales del curso: sin parámetros → conversaciones visibles para el rol, con
# tipo y estado. Conversaciones del usuario: pagina, por_pagina → colección de
# conversacion con su último mensaje.
# openapi/openapi.yaml · esquemas Conversacion y ConversacionConNoLeidos. La cantidad de
# no leídos es RF-47, Should have (Tabla 10): la respuesta no la incluye.
class ConversacionesController < ApplicationController
  autoriza :del_curso, roles: %w[docente tutor alumno]
  autoriza :index, roles: %w[docente tutor alumno]

  # CU-12 precondición · el usuario está vinculado al curso. El alumno lo está, pero el
  # canal de RF-25 no lo integra: recibe la colección vacía.
  def del_curso
    curso = Curso.find(params[:id])
    unless Conversacion.vinculado_al_curso?(usuario_actual, curso.id)
      raise ErrorDeDominio::NoHabilitado.new(
        codigo: "no_vinculado_al_curso", detalle: "El usuario no está vinculado a este curso."
      )
    end

    canales = Conversacion.del_usuario(usuario_actual).where(curso_id: curso.id).order(:tipo).to_a
    canales.each(&:sincronizar_participantes!)

    render json: { datos: canales.map(&:recurso), total: canales.size, pagina: 1, por_pagina: 25 },
           status: :ok
  end

  # Tabla 28 · colección paginada, ordenada por nombre del curso.
  def index
    pagina = [ params[:pagina].to_i, 1 ].max
    por_pagina = params[:por_pagina].to_i
    por_pagina = 25 if por_pagina <= 0
    por_pagina = [ por_pagina, 100 ].min

    relacion = Conversacion.del_usuario(usuario_actual).joins(:curso)
                           .order("curso.nombre ASC, conversacion.id ASC")
    datos = relacion.offset((pagina - 1) * por_pagina).limit(por_pagina).to_a
    datos.each(&:sincronizar_participantes!)

    render json: {
      datos: datos.map(&:recurso_con_ultimo_mensaje),
      total: relacion.count, pagina: pagina, por_pagina: por_pagina
    }, status: :ok
  end
end
