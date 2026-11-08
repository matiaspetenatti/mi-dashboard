import type {
  EstadoProyecto,
  Etiqueta,
  Proyecto,
  Tarea,
} from "@/server/db/schema"

export type EstadoDeTarea = Pick<
  EstadoProyecto,
  "id" | "nombre" | "color" | "categoria" | "posicion"
>

export type ProyectoDeTarea = Pick<
  Proyecto,
  "id" | "nombre" | "color" | "prefijo"
>

export type TareaBase = Tarea & {
  estado: EstadoDeTarea
  proyecto: ProyectoDeTarea
  etiquetas: Etiqueta[]
}

export type TareaConDetalle = TareaBase & {
  subtareas: TareaBase[]
  subtareasCompletadas: number
}

export type ResumenProyecto = {
  proyecto: Proyecto
  estados: EstadoProyecto[]
  total: number
  completadas: number
  pendientes: number
  vencidas: number
  progreso: number
}

export type WorkspaceTareas = {
  proyectos: ResumenProyecto[]
  estados: EstadoProyecto[]
  etiquetas: Etiqueta[]
  tareas: TareaConDetalle[]
}

export type VistaTareas = "lista" | "tablero" | "tabla" | "calendario"

export type FiltroVencimiento = "todas" | "hoy" | "vencidas" | "sin_fecha"

export type FiltrosTareas = {
  busqueda: string
  prioridad: string | null
  vencimiento: FiltroVencimiento
  mostrarCompletadas: boolean
}
