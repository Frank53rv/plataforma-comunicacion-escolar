# Tabla 35 · el catálogo es cerrado · Boundary 6
# Prueba: CP-RNF-17 — ningún rechazo de la interfaz emite un estado fuera de los nueve.
require "rails_helper"

RSpec.describe ErrorDeDominio do
  it "sólo admite los nueve estados de la Tabla 35" do
    expect(described_class::CATALOGO).to eq([ 401, 403, 404, 409, 410, 413, 415, 422, 500 ])
  end

  it "rechaza la construcción de un error con un estado fuera del catálogo" do
    expect {
      described_class.new(estado: 418, codigo: "x", detalle: "y")
    }.to raise_error(ArgumentError, /no pertenece al catálogo/)
  end

  describe "cada excepción corresponde a una fila de la Tabla 35" do
    {
      described_class::NoAutenticado          => 401,
      described_class::NoHabilitado           => 403,
      described_class::NoEncontrado           => 404,
      described_class::CodigoNoVigente        => 410,
      described_class::AdjuntoDemasiadoGrande => 413,
      described_class::FormatoNoAdmitido      => 415,
      described_class::DatosInaceptables      => 422
    }.each do |clase, estado|
      it "#{clase.name.demodulize} emite #{estado}" do
        expect(clase.new.estado).to eq(estado)
      end
    end
  end

  it "el conflicto de regla consigna el código de la regla, conforme a la Tabla 35" do
    error = described_class::ConflictoDeRegla.new(regla: "RN-31", detalle: "Ya hay un año lectivo vigente.")

    expect(error.estado).to eq(409)
    expect(error.regla).to eq("RN-31")
  end
end
