const TIME_ZONE = "America/Argentina/Cordoba"

export function fechaLarga(date = new Date()): string {
  const value = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TIME_ZONE,
  }).format(date)

  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function saludoDelDia(date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: TIME_ZONE,
    }).format(date),
  )

  if (hour < 12) return "Buen día"
  if (hour < 20) return "Buenas tardes"
  return "Buenas noches"
}

export function fechaHoy(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TIME_ZONE,
  }).format(date)
}

export function mesActual(date = new Date()): string {
  return fechaHoy(date).slice(0, 7)
}

export function diasHasta(fecha: string, desde = fechaHoy()): number {
  const a = Date.parse(`${desde}T00:00:00Z`)
  const b = Date.parse(`${fecha}T00:00:00Z`)
  return Math.round((b - a) / 86_400_000)
}

export function sumarFecha(
  fecha: string,
  unidad: "dia" | "semana" | "mes" | "anio",
  cada = 1,
): string {
  const [anio, mes, dia] = fecha.split("-").map(Number)

  if (unidad === "dia" || unidad === "semana") {
    const dias = (unidad === "dia" ? 1 : 7) * cada
    return new Date(Date.UTC(anio, mes - 1, dia + dias))
      .toISOString()
      .slice(0, 10)
  }

  const destino = mes - 1 + (unidad === "mes" ? 1 : 12) * cada
  const ultimoDia = new Date(Date.UTC(anio, destino + 1, 0)).getUTCDate()
  return new Date(Date.UTC(anio, destino, Math.min(dia, ultimoDia)))
    .toISOString()
    .slice(0, 10)
}
