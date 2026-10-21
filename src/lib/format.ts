// centavos -> "$ 1.500,50"
export function formatMonto(centavos: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(centavos / 100);
}

// "YYYY-MM-DD" en horario argentino (evita que el mes cambie antes de tiempo por UTC)
export function fechaHoy() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Cordoba",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function mesActual() {
  return fechaHoy().slice(0, 7); // "YYYY-MM"
}

// días entre dos fechas "YYYY-MM-DD" (negativo si ya pasó)
export function diasHasta(fecha: string, desde: string) {
  const a = Date.parse(`${desde}T00:00:00Z`);
  const b = Date.parse(`${fecha}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

export function textoDias(dias: number) {
  if (dias === 0) return "hoy";
  if (dias === 1) return "mañana";
  return `en ${dias} días`;
}

// suma N unidades a una fecha "YYYY-MM-DD"
// (mes/año: si el día no existe en el destino, usa el último del mes; ej. 31 ene + 1 mes = 28/29 feb)
export function sumarFecha(
  fecha: string,
  unidad: "dia" | "semana" | "mes" | "anio",
  cada = 1,
) {
  const [y, m, d] = fecha.split("-").map(Number);
  if (unidad === "dia" || unidad === "semana") {
    const dias = (unidad === "dia" ? 1 : 7) * cada;
    return new Date(Date.UTC(y, m - 1, d + dias)).toISOString().slice(0, 10);
  }
  const destino = m - 1 + (unidad === "mes" ? 1 : 12) * cada; // índice de mes, puede pasar de 11
  const ultimoDia = new Date(Date.UTC(y, destino + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, destino, Math.min(d, ultimoDia)))
    .toISOString()
    .slice(0, 10);
}
