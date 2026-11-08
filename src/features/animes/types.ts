import type { AnimeMetadatos, AnimeVisto } from "@/server/db/schema"
import type { EstadoAnime } from "./constantes"

export type ResumenAnimesWorkspace = {
  total: number
  viendo: number
  completados: number
  planeados: number
  pausados: number
  abandonados: number
  favoritos: number
  episodiosVistos: number
  horasEstimadas: number
  promedio: number | null
  mejorGenero: {
    genero: string
    promedio: number
    total: number
  } | null
}

export type EstadisticasAnimes = {
  porEstado: Array<{ estado: EstadoAnime; total: number }>
  porGenero: Array<{ genero: string; total: number }>
  porAno: Array<{ ano: number; total: number }>
  porEstudio: Array<{ valor: string; total: number }>
  top: Array<{
    id: number
    titulo: string
    miPuntaje: number | null
    scoreMal: number | null
  }>
  comparativa: Array<{
    titulo: string
    miPuntaje: number
    scoreMal: number
  }>
}

export type AnimesWorkspace = {
  animes: AnimeVisto[]
  resumen: ResumenAnimesWorkspace
  estadisticas: EstadisticasAnimes
  metadatos: AnimeMetadatos
}

export type VistaAnimes = "biblioteca" | "estadisticas" | "calendario"

export type KitsuAnime = {
  kitsuId: number
  titulo: string
  tituloIngles: string | null
  imagen: string
  tipo: string | null
  episodios: number | null
  ano: number | null
  fechaEmision: string | null
  generos: string[]
  descripcion: string | null
  scoreMal: number | null
  estudio: string | null
}

export type AnimeCalendarioItem = {
  id: string
  animeVistoId: number
  titulo: string
  imagen: string
  episodio: number | null
  hora: string
  fecha: string
  airingAt: string
  emitido: boolean
}

export type DiaCalendarioAnime = {
  indice: number
  nombre: string
  fecha: string
  items: AnimeCalendarioItem[]
}

export type AnimeSinHorario = {
  animeVistoId: number
  titulo: string
  imagen: string
}

export type CalendarioAnimes = {
  semana: { inicio: string; fin: string }
  dias: DiaCalendarioAnime[]
  sinHorario: AnimeSinHorario[]
  actualizadoEn: string
}
