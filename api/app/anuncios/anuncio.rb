# RF-17 Publicación de anuncios · RF-20 Borrado lógico de anuncios · RF-22 Consulta del
# historial de anuncios · CU-06, CU-08, CU-09 · RN-14, RN-16, RN-17, RN-20, RN-22
# Prueba: CP-RF-17 · CP-RF-20 · CP-RF-22
#
# Tabla 21 · «Comunicación institucional que el docente dirige a los cursos que dicta.»
# Tabla 27 · nombre de tabla en singular conforme a D-01. `programado_para` y el estado
# `programado` pertenecen a RF-18 (Should have): esta entrega sólo produce los estados
# `publicado` y `eliminado`, la publicación inmediata que semantica-temporal.md fija
# como «el caso ordinario y el único comprometido», y el borrado lógico de RN-20.
class Anuncio < ApplicationRecord
  self.table_name = "anuncio"

  enum :estado, {
    borrador: "borrador", programado: "programado", publicado: "publicado",
    archivado: "archivado", eliminado: "eliminado"
  }, prefix: :estado, validate: true

  belongs_to :autor, class_name: "Usuario", foreign_key: :autor_id
  # La columna `eliminado_por` no lleva el sufijo `_id`: la asociación se nombra
  # distinto para que el atributo crudo (el uuid que la petición escribe) no quede
  # sustituido por el setter de la asociación, que exigiría un Usuario y no un uuid.
  belongs_to :eliminador, class_name: "Usuario", foreign_key: "eliminado_por", optional: true
  has_many :vinculaciones_curso, class_name: "AnuncioCurso", foreign_key: :anuncio_id,
                                 inverse_of: :anuncio
  has_many :versiones, class_name: "AnuncioVersion", foreign_key: :anuncio_id,
                       inverse_of: :anuncio

  def version_vigente
    versiones.order(numero_version: :desc).first
  end

  # Tabla 40 · recurso anuncio con su anuncio_version y la cantidad de destinatarios
  # resueltos (POST /anuncios).
  def recurso(destinatarios_resueltos:)
    version = version_vigente
    slice(:id, :autor_id, :estado, :creado_en).merge(
      "anuncio_version" => version.slice(:id, :numero_version, :titulo, :cuerpo, :publicado_en),
      "destinatarios_resueltos" => destinatarios_resueltos
    )
  end

  # Tabla 40 · recurso anuncio con eliminado_en y eliminado_por (DELETE /anuncios/{id}).
  def recurso_eliminado
    slice(:id, :autor_id, :estado, :creado_en, :eliminado_en, :eliminado_por)
  end

  # Tabla 40 · recurso anuncio con su versión vigente, sus cursos y sus adjuntos
  # (GET /anuncios/{id}). Adjuntos vacío: RF-30 (Should have) no se construye acá.
  def recurso_detalle
    version = version_vigente
    slice(:id, :autor_id, :estado, :creado_en).merge(
      "anuncio_version" => version.slice(:id, :numero_version, :titulo, :cuerpo, :publicado_en),
      "cursos" => vinculaciones_curso.pluck(:curso_id),
      "adjuntos" => []
    )
  end
end
