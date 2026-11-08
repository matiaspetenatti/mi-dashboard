import { fechaHoy } from "@/lib/dates"
import type {
  EstadoDeTarea,
  FiltrosTareas,
  TareaConDetalle,
} from "../types"

export function filtrarTareas(
  tareas: TareaConDetalle[],
  proyectoId: number | null,
  filtros: FiltrosTareas,
): TareaConDetalle[] {
  const hoy = fechaHoy()
  const busqueda = filtros.busqueda.trim().toLowerCase()

  return tareas.filter((tarea) => {
    if (proyectoId !== null && tarea.proyectoId !== proyectoId) return false

    if (
      !filtros.mostrarCompletadas &&
      (tarea.estado.categoria === "completado" ||
        tarea.estado.categoria === "cancelado")
    ) {
      return false
    }

    if (busqueda) {
      const enTitulo = tarea.titulo.toLowerCase().includes(busqueda)
      const enDescripcion = (tarea.descripcion ?? "")
        .toLowerCase()
        .includes(busqueda)
      if (!enTitulo && !enDescripcion) return false
    }

    if (filtros.prioridad && tarea.prioridad !== filtros.prioridad) {
      return false
    }

    if (filtros.vencimiento === "hoy" && tarea.fechaLimite !== hoy) {
      return false
    }

    if (
      filtros.vencimiento === "vencidas" &&
      (!tarea.fechaLimite || tarea.fechaLimite >= hoy)
    ) {
      return false
    }

    if (filtros.vencimiento === "sin_fecha" && tarea.fechaLimite !== null) {
      return false
    }

    return true
  })
}

export function agruparPorEstado(
  tareas: TareaConDetalle[],
  estados: EstadoDeTarea[],
) {
  const porEstado = new Map<number, TareaConDetalle[]>()
  for (const estado of estados) porEstado.set(estado.id, [])
  for (const tarea of tareas) {
    const lista = porEstado.get(tarea.estadoId)
    if (lista) lista.push(tarea)
  }

  return estados
    .map((estado) => ({
      estado,
      tareas: porEstado.get(estado.id) ?? [],
    }))
    .filter((grupo) => grupo.tareas.length > 0)
}

export function resumenTareas(tareas: TareaConDetalle[]) {
  const hoy = fechaHoy()
  let pendientes = 0
  let completadas = 0
  let hoyCount = 0
  let vencidas = 0
  let sinFecha = 0

  for (const tarea of tareas) {
    if (tarea.estado.categoria === "completado") {
      completadas += 1
      continue
    }
    if (tarea.estado.categoria === "cancelado") continue

    pendientes += 1
    if (!tarea.fechaLimite) {
      sinFecha += 1
    } else if (tarea.fechaLimite < hoy) {
      vencidas += 1
    } else if (tarea.fechaLimite === hoy) {
      hoyCount += 1
    }
  }

  return { pendientes, completadas, hoy: hoyCount, vencidas, sinFecha }
}
