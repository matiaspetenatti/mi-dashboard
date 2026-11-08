import { sumarFecha } from "@/lib/dates"
import { formatearFecha } from "@/lib/format"

export const ZONA_HORARIA_SALUD = "America/Argentina/Cordoba"

export const REGEX_FECHA_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
export const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/

export function fechaHoraAhora(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA_SALUD,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date())

  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "00"

  return `${valor("year")}-${valor("month")}-${valor("day")}T${valor(
    "hour",
  )}:${valor("minute")}`
}

export function sumarDias(fecha: string, dias: number) {
  return sumarFecha(fecha, "dia", dias)
}

export function mesAnterior(mes: string): string {
  const [anio, numeroMes] = mes.split("-").map(Number)
  return new Date(Date.UTC(anio, numeroMes - 2, 1)).toISOString().slice(0, 7)
}

export function partirEnFechaHora(valor: string) {
  return {
    fecha: valor.slice(0, 10),
    hora: valor.slice(11, 16),
  }
}

export function unirFechaHora(fecha: string, hora: string) {
  if (!fecha || !hora) return null
  return `${fecha}T${hora}`
}

export function minutosEntre(inicio: string, fin: string) {
  const a = Date.parse(`${inicio.slice(0, 16)}:00Z`)
  const b = Date.parse(`${fin.slice(0, 16)}:00Z`)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  return Math.round((b - a) / 60_000)
}

export function formatearDuracion(minutos: number | null) {
  if (minutos === null) return "En curso"
  if (!Number.isFinite(minutos) || minutos < 0) return "—"
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`
}

export function formatearFechaHoraCorta(valor: string) {
  const { fecha, hora } = partirEnFechaHora(valor)
  return `${formatearFecha(fecha, false)} · ${hora}`
}

export function formatearDiaCorto(fecha: string) {
  return formatearFecha(fecha, false)
}

export function formatearDiaLargo(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number)
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(anio, mes - 1, dia)))
}

export function compararFechaHora(a: string, b: string) {
  if (a === b) return 0
  return a < b ? -1 : 1
}

export function diasEntre(desde: string, hasta: string) {
  const a = Date.parse(`${desde}T00:00:00Z`)
  const b = Date.parse(`${hasta}T00:00:00Z`)
  return Math.round((b - a) / 86_400_000) + 1
}
