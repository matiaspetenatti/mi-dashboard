import { fechaHoy } from "@/lib/dates"
import { formatearFecha } from "@/lib/format"

export function textoVencimiento(fecha: string | null): string | null {
  if (!fecha) return null
  const hoy = fechaHoy()

  if (fecha === hoy) return "Hoy"

  const a = Date.parse(`${hoy}T00:00:00Z`)
  const b = Date.parse(`${fecha}T00:00:00Z`)
  const dias = Math.round((b - a) / 86_400_000)

  if (dias === 1) return "Mañana"
  if (dias === -1) return "Ayer"
  if (dias > 1 && dias <= 7) return `En ${dias} días`
  if (dias < -1 && dias >= -7) return `Hace ${Math.abs(dias)} días`

  return formatearFecha(fecha, false)
}

export function esVencida(fecha: string | null): boolean {
  return fecha !== null && fecha < fechaHoy()
}

export function colorPrioridad(prioridad: string | null): string {
  switch (prioridad) {
    case "urgente":
      return "bg-error-container text-error border-error/20"
    case "alta":
      return "bg-warning-container text-on-warning-container border-warning/20"
    case "media":
      return "bg-signal-blue/10 text-signal-blue border-signal-blue/20"
    case "baja":
      return "bg-surface-container text-muted-foreground border-outline-variant/40"
    default:
      return "bg-surface-container text-muted-foreground border-outline-variant/40"
  }
}
