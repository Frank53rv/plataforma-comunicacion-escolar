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

  # openapi/openapi.yaml · esquema Anuncio: id, autor_id, estado, programado_para,
  # creado_en. programado_para queda siempre en nulo: RF-18 (Should have) no se
  # construye, así que ningún anuncio de esta entrega llega a ese estado.
  def base
    slice(:id, :autor_id, :estado, :programado_para, :creado_en)
  end

  # openapi/openapi.yaml · esquema AnuncioVersion: id, anuncio_id, numero_version,
  # titulo, cuerpo, publicado_en.
  def self.version_recurso(version)
    version.slice(:id, :anuncio_id, :numero_version, :titulo, :cuerpo, :publicado_en)
  end

  # openapi/openapi.yaml · esquema AnuncioPublicado: Anuncio + anuncio_version +
  # destinatarios_resueltos (POST /anuncios).
  def recurso(destinatarios_resueltos:)
    base.merge(
      "anuncio_version" => self.class.version_recurso(version_vigente),
      "destinatarios_resueltos" => destinatarios_resueltos
    )
  end

  # openapi/openapi.yaml · esquema AnuncioEliminado: Anuncio + eliminado_en +
  # eliminado_por (DELETE /anuncios/{id}).
  def recurso_eliminado
    base.merge(slice(:eliminado_en, :eliminado_por))
  end

  # openapi/openapi.yaml · esquema AnuncioDetalle: Anuncio + version (con ese nombre,
  # no «anuncio_version») + cursos (el recurso Curso completo, no sólo su id) +
  # adjuntos. Adjuntos vacío: RF-30 (Should have) no se construye acá.
  def recurso_detalle
    base.merge(
      "version" => self.class.version_recurso(version_vigente),
      "cursos" => vinculaciones_curso.map { |vinculo| vinculo.curso.recurso },
      "adjuntos" => []
    )
  end
end
