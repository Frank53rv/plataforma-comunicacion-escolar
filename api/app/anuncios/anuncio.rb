# RF-17 Publicación de anuncios · CU-06 · RN-16, RN-17
# Prueba: CP-RF-17
#
# Tabla 21 · «Comunicación institucional que el docente dirige a los cursos que dicta.»
# Tabla 27 · nombre de tabla en singular conforme a D-01. `programado_para` y el estado
# `programado` pertenecen a RF-18 (Should have): esta entrega sólo produce el estado
# `publicado`, la publicación inmediata que semantica-temporal.md fija como «el caso
# ordinario y el único comprometido».
class Anuncio < ApplicationRecord
  self.table_name = "anuncio"

  enum :estado, {
    borrador: "borrador", programado: "programado", publicado: "publicado",
    archivado: "archivado", eliminado: "eliminado"
  }, prefix: :estado, validate: true

  belongs_to :autor, class_name: "Usuario", foreign_key: :autor_id
  belongs_to :eliminado_por, class_name: "Usuario", optional: true
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
end
