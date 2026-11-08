export function formatMonto(centavos: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(centavos / 100)
}

export function formatMontoCompacto(pesos: number): string {
  if (Math.abs(pesos) >= 1_000_000) {
    return `$ ${(pesos / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })}M`
  }
  if (Math.abs(pesos) >= 1_000) {
    return `$ ${(pesos / 1_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })}k`
  }
  return `$ ${pesos.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
}

export function formatearFecha(fecha: string, conAnio = true): string {
  const [anio, mes, dia] = fecha.split("-").map(Number)
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    ...(conAnio ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(Date.UTC(anio, mes - 1, dia)))
}

export function formatNota(nota: number): string {
  return nota.toLocaleString("es-AR", { maximumFractionDigits: 2 })
}
