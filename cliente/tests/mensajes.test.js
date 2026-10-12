// RF-25 Canal grupal del curso · RF-28 Persistencia e historial de mensajes · CU-12 · RN-27
// Prueba: CP-RF-25 · CP-RF-28
//
// RN-27 · la base de datos es la única fuente de verdad: los mensajes que llegan en vivo y los
// que trae el historial son los mismos y no deben duplicarse ni desordenarse.
import { unirMensajes } from "../conversacion/mensajes.js";

const m = (id, enviado_en) => ({ id, cuerpo: id, enviado_en });

describe("unión de mensajes", () => {
  it("ordena por hora de envío, del más antiguo al más reciente", () => {
    const resultado = unirMensajes(
      [m("c", "2026-03-02T15:03:00Z")],
      [m("a", "2026-03-02T15:01:00Z"), m("b", "2026-03-02T15:02:00Z")],
    );

    expect(resultado.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });

  it("no repite un mensaje que ya estaba: llegó por el canal y también por la consulta", () => {
    const resultado = unirMensajes(
      [m("a", "2026-03-02T15:01:00Z")],
      [m("a", "2026-03-02T15:01:00Z"), m("b", "2026-03-02T15:02:00Z")],
    );

    expect(resultado.map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("uno solo o ninguno", () => {
    expect(unirMensajes([], [])).toEqual([]);
    expect(unirMensajes([], [m("a", "2026-03-02T15:01:00Z")])).toHaveLength(1);
  });

  it("no modifica lo que recibe", () => {
    const previos = [m("b", "2026-03-02T15:02:00Z")];
    unirMensajes(previos, [m("a", "2026-03-02T15:01:00Z")]);

    expect(previos.map((x) => x.id)).toEqual(["b"]);
  });
});
