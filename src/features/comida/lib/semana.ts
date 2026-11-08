import { diasHasta, fechaHoy, sumarFecha } from "@/lib/dates"
import { formatearFecha } from "@/lib/format"

export const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/

export function inicioSemana(fecha: string = fechaHoy()) {
  const [anio, mes, dia] = fecha.split("-").map(Number)
  const fechaUtc = new Date(Date.UTC(anio, mes - 1, dia))
  const diaSemana = fechaUtc.getUTCDay()
  const retroceso = diaSemana === 0 ? 6 : diaSemana - 1
  return new Date(Date.UTC(anio, mes - 1, dia - retroceso))
    .toISOString()
    .slice(0, 10)
}

export function diasDeSemana(inicio: string) {
  return Array.from({ length: 7 }, (_, indice) =>
    sumarFecha(inicio, "dia", indice),
  )
}

export function semanaComida(valor: string | undefined) {
  if (!valor || !REGEX_FECHA.test(valor)) return inicioSemana()
  return inicioSemana(valor)
}

export function etiquetaDiaCorto(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number)
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(anio, mes - 1, dia)))
    .replace(".", "")
}

export function etiquetaDiaLargo(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number)
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(anio, mes - 1, dia)))
}

export function etiquetaDiaNumero(fecha: string) {
  return formatearFecha(fecha, false)
}

export function rangoSemana(inicio: string) {
  const fin = sumarFecha(inicio, "dia", 6)
  return `${etiquetaDiaCorto(inicio)} – ${etiquetaDiaCorto(fin)}`
}

export function tituloSemana(inicio: string, hoy: string = fechaHoy()) {
  const diferencia = diasHasta(inicio, inicioSemana(hoy))
  if (diferencia === 0) return "Esta semana"
  if (diferencia === 7) return "Próxima semana"
  if (diferencia === -7) return "Semana pasada"
  return `Semana del ${etiquetaDiaNumero(inicio)}`
}

export function esHoy(fecha: string, hoy: string = fechaHoy()) {
  return fecha === hoy
}
