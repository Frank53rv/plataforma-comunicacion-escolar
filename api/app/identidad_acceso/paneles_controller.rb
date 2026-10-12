# RF-40 Paneles diferenciados por rol · CU-09 · RN-04, RN-15
# Prueba: CP-RF-40
#
# Tabla 18 · GET /api/v1/paneles/me · Directivo, docente, tutor, alumno.
# Tabla 29 · sin parámetros → rol, nombre, opciones habilitadas y cantidad de anuncios sin
# leer. openapi/openapi.yaml · esquema Panel, que además lleva los cursos de la persona.
class PanelesController < ApplicationController
  autoriza :mostrar, roles: %w[directivo docente tutor alumno]

  def mostrar
    render json: PanelDelUsuario.para(usuario_actual), status: :ok
  end
end
