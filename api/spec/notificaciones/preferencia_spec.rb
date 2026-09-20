# RF-33 Configuración de preferencias · CU-13 · RN-18, RN-24
# Prueba: CP-RF-33
#
# specs/25-semantica-temporal.md · «La franja de disponibilidad admite que la hora
# final sea anterior a la inicial, caso en el que cruza la medianoche… El extremo
# inicial se incluye y el final se excluye… La igualdad de ambos extremos designa
# disponibilidad permanente.»
require "rails_helper"

RSpec.describe Preferencia, type: :model do
  def momento_en(hhmm)
    Time.find_zone("America/Asuncion").parse("2026-03-02 #{hhmm}")
  end

  describe "franja que no cruza la medianoche" do
    subject(:preferencia) { build(:preferencia, hora_inicio: "08:00", hora_fin: "20:00") }

    it "admite envío dentro de la franja, incluido el extremo inicial" do
      expect(preferencia.admite_envio?(momento_en("08:00"))).to be(true)
      expect(preferencia.admite_envio?(momento_en("12:00"))).to be(true)
    end

    it "excluye el extremo final y lo posterior" do
      expect(preferencia.admite_envio?(momento_en("20:00"))).to be(false)
      expect(preferencia.admite_envio?(momento_en("23:00"))).to be(false)
      expect(preferencia.admite_envio?(momento_en("07:59"))).to be(false)
    end
  end

  describe "franja que cruza la medianoche (RN-24)" do
    subject(:preferencia) { build(:preferencia, hora_inicio: "22:00", hora_fin: "07:00") }

    it "admite envío después del inicio y antes de la medianoche" do
      expect(preferencia.admite_envio?(momento_en("23:00"))).to be(true)
    end

    it "admite envío después de la medianoche y antes del final" do
      expect(preferencia.admite_envio?(momento_en("03:00"))).to be(true)
    end

    it "no admite envío fuera de la franja" do
      expect(preferencia.admite_envio?(momento_en("12:00"))).to be(false)
    end
  end

  describe "extremos iguales · disponibilidad permanente" do
    subject(:preferencia) { build(:preferencia, hora_inicio: "00:00", hora_fin: "00:00") }

    it "admite envío a cualquier hora" do
      expect(preferencia.admite_envio?(momento_en("00:00"))).to be(true)
      expect(preferencia.admite_envio?(momento_en("13:37"))).to be(true)
    end
  end

  describe "recibir_mensajes en falso" do
    it "no admite envío aunque esté dentro de la franja" do
      preferencia = build(:preferencia, hora_inicio: "00:00", hora_fin: "00:00", recibir_mensajes: false)
      expect(preferencia.admite_envio?(momento_en("13:37"))).to be(false)
    end
  end

  describe "próximo inicio, para diferir" do
    it "es el mismo día si el inicio todavía no pasó" do
      preferencia = build(:preferencia, hora_inicio: "22:00", hora_fin: "07:00")
      esperado = Time.find_zone("America/Asuncion").parse("2026-03-02 22:00")

      expect(preferencia.proximo_inicio(momento_en("12:00"))).to eq(esperado)
    end

    it "es al día siguiente si el inicio ya pasó" do
      preferencia = build(:preferencia, hora_inicio: "08:00", hora_fin: "20:00")
      esperado = Time.find_zone("America/Asuncion").parse("2026-03-03 08:00")

      expect(preferencia.proximo_inicio(momento_en("21:00"))).to eq(esperado)
    end
  end

  describe "sin fila configurada · RN-18, RN-24" do
    it "está disponible las 24 horas y admite mensajes" do
      sin_configurar = Preferencia.de(create(:usuario, :docente))

      expect(sin_configurar.admite_envio?(momento_en("03:00"))).to be(true)
      expect(sin_configurar.admite_envio?(momento_en("15:00"))).to be(true)
    end
  end
end
