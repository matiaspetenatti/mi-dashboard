import type {
  EpisodioSalud,
  RegistroDiarioSalud,
} from "@/server/db/schema"

export type VistaSalud = "migrana" | "bienestar"

export type EpisodioConFactores = EpisodioSalud & {
  factores: string[]
}

export type PuntoSerie = {
  fecha: string
  etiqueta: string
  eva: number | null
  duracionHoras: number
  episodios: number
}

export type FilaMapa = {
  factor: string
  etiqueta: string
  categoria: string
  episodios: number
  porcentaje: number
}

export type MetricaCorrelacion = {
  clave: string
  etiqueta: string
  unidad: string
  conCrisis: number | null
  sinCrisis: number | null
}

export type CorrelacionHabitos = {
  registros: number
  registrosConCrisis: number
  registrosSinCrisis: number
  metricas: MetricaCorrelacion[]
}

export type ResumenSalud = {
  diasTranscurridos: number
  diasLibres: number
  rachaLibre: number | null
  episodiosMes: number
  episodiosMesAnterior: number
  evaPromedio: number | null
  duracionPromedioMin: number | null
  efectividadTetralgin: number | null
  episodiosConTetralgin: number
  episodiosConAlivio: number
  totalEpisodios: number
  totalConAura: number
  serie: PuntoSerie[]
  mapa: FilaMapa[]
  correlacion: CorrelacionHabitos | null
}

export type WorkspaceSalud = ResumenSalud & {
  hoy: string
  ahora: string
  episodios: EpisodioConFactores[]
  diario: RegistroDiarioSalud[]
}

export type ResumenSaludWidget = {
  episodiosMes: number
  episodiosMesAnterior: number
  diasLibres: number
  diasTranscurridos: number
  rachaLibre: number | null
  evaPromedio: number | null
  duracionPromedioMin: number | null
  efectividadTetralgin: number | null
  episodiosConTetralgin: number
  episodiosConAlivio: number
  totalEpisodios: number
  totalConAura: number
}
