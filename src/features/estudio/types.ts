import type {
  Carrera,
  Examen,
  Materia,
  SesionEstudio,
} from "@/server/db/schema"

export type ExamenConContexto = Examen & {
  materia: string
  carreraId: number
  carrera: string
}

export type ResumenMaterias = {
  total: number
  aprobadas: number
  regulares: number
  cursando: number
  pendientes: number
  libres: number
  totalPlan: number
  progreso: number
  promedio: number | null
}

export type ResumenCarrera = ResumenMaterias & {
  carrera: Carrera
  materias: Materia[]
  examenes: ExamenConContexto[]
  proximoExamen: ExamenConContexto | null
  graduacionEstimada: number | null
}

export type ResumenEstudio = {
  totalCarreras: number
  carrerasActivas: number
  totalMaterias: number
  aprobadas: number
  totalPlan: number
  progreso: number
  promedio: number | null
  proximosExamenes: number
}

export type EstudioWorkspace = {
  hoy: string
  carreras: ResumenCarrera[]
  proximosExamenes: ExamenConContexto[]
  resumen: ResumenEstudio
  sesiones: SesionEstudio[]
}
