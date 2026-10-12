// RF-22 Consulta del historial de anuncios · RF-40 · CU-09
// Prueba: CP-RF-22
//
// specs/25-semantica-temporal.md · «La zona de interpretación y presentación es la de la
// República del Paraguay… America/Asuncion. No hay zona por usuario.» Toda marca de tiempo
// se almacena en tiempo universal: el cliente la presenta en esa zona, y el día que la
// persona elige en un filtro es el día de Asunción y no el de su navegador.
import {
  formatearFecha,
  formatearFechaHora,
  instanteDeFinDeDia,
  instanteDeInicioDeDia,
} from "../comun/fechas.js";

describe("presentación en America/Asuncion", () => {
  it("presenta la marca de tiempo universal en hora de Asunción, dd/mm/aaaa HH:MM de 24 horas", () => {
    expect(formatearFechaHora("2026-03-02T15:30:00Z")).toBe("02/03/2026 12:30");
  });

  it("la medianoche de Asunción no se presenta como hora 24", () => {
    expect(formatearFechaHora("2026-03-02T03:00:00Z")).toBe("02/03/2026 00:00");
  });

  it("una hora universal cercana a la medianoche pertenece al día anterior en Asunción", () => {
    expect(formatearFechaHora("2026-03-02T02:59:00Z")).toBe("01/03/2026 23:59");
    expect(formatearFecha("2026-03-02T02:59:00Z")).toBe("01/03/2026");
  });
});

describe("el día elegido en un filtro es el de Asunción", () => {
  it("el inicio del día es la medianoche de Asunción, expresada en tiempo universal", () => {
    expect(instanteDeInicioDeDia("2026-03-02")).toBe(
      "2026-03-02T03:00:00.000Z",
    );
  });

  it("el fin del día es el último milisegundo antes de la medianoche siguiente", () => {
    expect(instanteDeFinDeDia("2026-03-02")).toBe("2026-03-03T02:59:59.999Z");
  });

  it("un anuncio publicado a las 23:30 de Asunción cae dentro de ese día", () => {
    const publicado = "2026-03-03T02:30:00.000Z"; // 02/03 23:30 en Asunción
    expect(publicado >= instanteDeInicioDeDia("2026-03-02")).toBe(true);
    expect(publicado <= instanteDeFinDeDia("2026-03-02")).toBe(true);
  });

  it("un día vacío no produce fecha", () => {
    expect(instanteDeInicioDeDia("")).toBeUndefined();
    expect(instanteDeFinDeDia("")).toBeUndefined();
  });

  it("cruza el fin de mes y de año", () => {
    expect(instanteDeFinDeDia("2026-12-31")).toBe("2027-01-01T02:59:59.999Z");
  });
});
