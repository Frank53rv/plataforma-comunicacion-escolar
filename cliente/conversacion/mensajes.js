// RF-25 Canal grupal del curso · RF-28 Persistencia e historial de mensajes · CU-12 · RN-27
// Prueba: CP-RF-25 · CP-RF-28
//
// RN-27 · la base de datos es la única fuente de verdad. Un mensaje puede llegar por el
// historial, por el canal en vivo y por la respuesta del propio envío: es el mismo mensaje
// y se presenta una sola vez, en orden de envío.
export function unirMensajes(actuales, nuevos) {
  const porId = new Map();
  [...actuales, ...nuevos].forEach((mensaje) => porId.set(mensaje.id, mensaje));
  return [...porId.values()].sort(
    (a, b) => Date.parse(a.enviado_en) - Date.parse(b.enviado_en),
  );
}
