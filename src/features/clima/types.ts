import type { IconoClima } from "./lib/weather"

export type UbicacionClima = {
  id: number
  etiqueta: string
  latitud: number
  longitud: number
  esActiva: boolean
}

export type ClimaActual = {
  temperatura: number
  sensacion: number
  humedad: number
  viento: number
  lluvia: number
  presion: number
  esDia: boolean
  codigo: number
  descripcion: string
  icono: IconoClima
}

export type DiaClima = {
  fecha: string
  codigo: number
  descripcion: string
  icono: IconoClima
  max: number
  min: number
  probLluvia: number
  uv: number
  amanecer: string
  atardecer: string
}

export type HoraClima = {
  hora: string
  temperatura: number
  probLluvia: number
  codigo: number
  descripcion: string
  icono: IconoClima
  viento: number
  humedad: number
  esDia: boolean
}

export type WorkspaceClima =
  | {
      needsLocation: true
      ubicaciones: UbicacionClima[]
    }
  | {
      needsLocation: false
      ubicaciones: UbicacionClima[]
      activa: UbicacionClima
      actual: ClimaActual
      dias: DiaClima[]
      horas: HoraClima[]
    }

export type ResultadoGeocoding = {
  id: number
  nombre: string
  provincia: string | null
  pais: string | null
  latitud: number
  longitud: number
}
