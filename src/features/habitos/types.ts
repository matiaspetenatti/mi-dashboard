import type {
  GithubActividad,
  Habito,
  HabitoRegistro,
} from "@/server/db/schema"

export type RegistroHabitoSimple = {
  fecha: string
  completado: boolean
}

export type HabitoConEstado = Habito & {
  completadoHoy: boolean
  rachaActual: number
  rachaMaxima: number
  porcentaje: number
  ultimos7: Array<{ fecha: string; completado: boolean }>
  registrosUltimoAnio: RegistroHabitoSimple[]
  registros: HabitoRegistro[]
}

export type ResumenHabitos = {
  activos: number
  buenos: number
  malos: number
  archivados: number
  completadosHoy: number
  mejorRacha: number
  commitsGithub: number
  diasConActividad: number
}

export type WorkspaceHabitos = {
  hoy: string
  habitos: HabitoConEstado[]
  resumen: ResumenHabitos
  github: GithubActividad[]
}

export type ResumenHabitosWidget = {
  activos: number
  completadosHoy: number
  mejorRacha: number
  commitsGithub: number
  habitosHoy: Array<{
    id: number
    titulo: string
    emoji: string | null
    color: string
    completado: boolean
  }>
}
