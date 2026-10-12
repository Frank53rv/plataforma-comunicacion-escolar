// RF-22 Consulta del historial de anuncios · RF-40 · CU-09
// Prueba: CP-RF-22
//
// specs/25-semantica-temporal.md · la zona de interpretación y presentación es una sola,
// America/Asuncion, y no hay zona por usuario. La interfaz de programación almacena todo en
// tiempo universal: acá se presenta en esa zona, y el día que la persona elige como límite
// de un filtro se interpreta en esa zona y no en la de su navegador.
const ZONA = "America/Asuncion";

const formato = new Intl.DateTimeFormat("en-GB", {
  timeZone: ZONA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function partesEnAsuncion(instante) {
  const partes = {};
  formato.formatToParts(instante).forEach(({ type, value }) => {
    partes[type] = Number(value);
  });
  return partes;
}

const dosDigitos = (n) => String(n).padStart(2, "0");

export function formatearFecha(iso) {
  const p = partesEnAsuncion(new Date(iso));
  return `${dosDigitos(p.day)}/${dosDigitos(p.month)}/${p.year}`;
}

export function formatearFechaHora(iso) {
  const p = partesEnAsuncion(new Date(iso));
  return `${formatearFecha(iso)} ${dosDigitos(p.hour)}:${dosDigitos(p.minute)}`;
}

// El instante universal cuya hora de pared en Asunción es la indicada.
function instanteDePared(anio, mes, dia, hora, minuto, segundo, milisegundo) {
  const supuesto = Date.UTC(anio, mes - 1, dia, hora, minuto, segundo);
  const p = partesEnAsuncion(new Date(supuesto));
  const pared = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  return new Date(supuesto - (pared - supuesto) + milisegundo).toISOString();
}

function dividir(fecha) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return { anio, mes, dia };
}

// «aaaa-mm-dd» de un campo de fecha → el primer instante de ese día en Asunción.
export function instanteDeInicioDeDia(fecha) {
  if (!fecha) return undefined;
  const { anio, mes, dia } = dividir(fecha);
  return instanteDePared(anio, mes, dia, 0, 0, 0, 0);
}

// … y el último.
export function instanteDeFinDeDia(fecha) {
  if (!fecha) return undefined;
  const { anio, mes, dia } = dividir(fecha);
  return instanteDePared(anio, mes, dia, 23, 59, 59, 999);
}
