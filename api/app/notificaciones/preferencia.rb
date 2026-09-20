# RF-33 Configuración de preferencias · CU-13 · RN-18, RN-24
# Prueba: CP-RF-33
#
# Tabla 14 · «Horario de disponibilidad y preferencias de recepción de un usuario.»
# Tabla 27 · UNIQUE (usuario_id).
# specs/25-semantica-temporal.md · las horas de pared se interpretan en
# America/Asuncion; la franja admite que hora_fin sea anterior a hora_inicio, caso en
# que cruza la medianoche, y la igualdad de ambos extremos designa disponibilidad
# permanente.
class Preferencia < ApplicationRecord
  self.table_name = "preferencia"

  # specs/25-semantica-temporal.md · «las horas de pared… se interpretan» en la zona
  # declarada, y sólo esas: el mecanismo de zona horaria de ActiveRecord para columnas
  # `time` reinterpreta la hora de pared como si fuera un instante de esa zona y la
  # corre al asignarla o leerla, que es precisamente la otra zona que la especificación
  # prohíbe introducir. Se excluye para que hora_inicio y hora_fin guarden el número que
  # se les asigna.
  self.skip_time_zone_conversion_for_attributes = [ :hora_inicio, :hora_fin ]

  belongs_to :usuario

  validates :hora_inicio, :hora_fin, presence: true
  validates :recibir_mensajes, inclusion: { in: [ true, false ] }

  # RN-18, RN-24 · sin fila configurada, la persona está disponible las 24 horas y
  # admite mensajes: la ausencia de configuración no puede silenciarla.
  def self.de(usuario)
    find_by(usuario_id: usuario.id) ||
      new(usuario: usuario, hora_inicio: "00:00", hora_fin: "00:00", recibir_mensajes: true)
  end

  # RN-24 · «Nada se silencia.» El extremo inicial se incluye y el final se excluye; la
  # igualdad de ambos extremos cubre el día completo, y hora_fin <= hora_inicio cruza la
  # medianoche.
  def admite_envio?(momento)
    return false unless recibir_mensajes

    h = momento.in_time_zone("America/Asuncion").strftime("%H:%M")
    inicio, fin = hora_de(hora_inicio), hora_de(hora_fin)
    return true if inicio == fin

    inicio < fin ? (h >= inicio && h < fin) : (h >= inicio || h < fin)
  end

  # RN-24 · cuándo sale un mensaje para esta persona: ahora si está disponible, al
  # comienzo de su próxima franja si no; nunca, si no recibe mensajes por push.
  def instante_de_envio(desde)
    return nil unless recibir_mensajes

    admite_envio?(desde) ? desde : proximo_inicio(desde)
  end

  # RN-24 · diferir consiste en encolar hasta el comienzo de la próxima franja.
  def proximo_inicio(desde)
    zona = "America/Asuncion"
    local = desde.in_time_zone(zona)
    candidato = local.change(hour: hora_inicio.hour, min: hora_inicio.min)
    candidato += 1.day if candidato <= local
    candidato.in_time_zone(zona)
  end

  def recurso
    slice(:id, :usuario_id).merge(
      "hora_inicio" => hora_de(hora_inicio), "hora_fin" => hora_de(hora_fin),
      "recibir_mensajes" => recibir_mensajes
    )
  end

  private

  def hora_de(valor)
    valor.strftime("%H:%M")
  end
end
