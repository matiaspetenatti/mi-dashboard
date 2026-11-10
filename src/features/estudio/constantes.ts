import type {
  Cuatrimestre,
  EstadoCarrera,
  EstadoExamen,
  EstadoMateria,
  ResultadoExamen,
  TipoExamen,
  TipoSesion,
} from "@/server/db/schema"

export const notasAprobado = 6

export const paletaCarreras = [
  "#8b4a2b",
  "#6750a4",
  "#386a52",
  "#0b6bcb",
  "#a23b72",
  "#7d6a00",
  "#3d5a80",
  "#7a4f01",
] as const

export const aniosMateria = [1, 2, 3, 4, 5, 6] as const

export const etiquetasEstadoCarrera: Record<EstadoCarrera, string> = {
  cursando: "Cursando",
  pausada: "Pausada",
  graduada: "Graduada",
  abandonada: "Abandonada",
}

export const etiquetasEstadoMateria: Record<EstadoMateria, string> = {
  pendiente: "Pendiente",
  cursando: "Cursando",
  regular: "Regular",
  aprobada: "Aprobada",
  libre: "Libre",
}

export const etiquetasCuatrimestre: Record<Cuatrimestre, string> = {
  "1": "1° cuatrimestre",
  "2": "2° cuatrimestre",
  anual: "Anual",
}

export const etiquetasTipoExamen: Record<TipoExamen, string> = {
  parcial: "Parcial",
  final: "Final",
  recuperatorio: "Recuperatorio",
  tp: "Trabajo práctico",
  coloquio: "Coloquio",
  otro: "Otro",
}

export const etiquetasEstadoExamen: Record<EstadoExamen, string> = {
  programado: "Programado",
  rendido: "Rendido",
  ausente: "Ausente",
}

export const etiquetasResultadoExamen: Record<ResultadoExamen, string> = {
  aprobado: "Aprobado",
  desaprobado: "Desaprobado",
}

export const etiquetasTipoSesion: Record<TipoSesion, string> = {
  trabajo: "Trabajo",
  descanso_corto: "Descanso corto",
  descanso_largo: "Descanso largo",
}
