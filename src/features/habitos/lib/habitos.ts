import { sumarFecha } from "@/lib/dates"
import type {
  GithubActividad,
  Habito,
  HabitoRegistro,
} from "@/server/db/schema"
import type {
  HabitoConEstado,
  RegistroHabitoSimple,
  ResumenHabitos,
} from "../types"

export function diasUltimoAnio(hoy: string, cantidad = 365): string[] {
  return Array.from({ length: cantidad }, (_, indice) =>
    sumarFecha(hoy, "dia", indice - (cantidad - 1)),
  )
}

export function fechasUltimos7(hoy: string): string[] {
  return Array.from({ length: 7 }, (_, indice) =>
    sumarFecha(hoy, "dia", indice - 6),
  )
}

export function mapaRegistros(
  registros: Array<{ fecha: string; completado: boolean }>,
) {
  return new Map(registros.map((registro) => [registro.fecha, registro.completado]))
}

export function calcularRachaActual(
  registros: Array<{ fecha: string; completado: boolean }>,
  hoy: string,
) {
  const mapa = mapaRegistros(registros)
  let racha = 0
  let fecha = hoy

  while (mapa.get(fecha) === true) {
    racha += 1
    fecha = sumarFecha(fecha, "dia", -1)
  }

  return racha
}

export function calcularRachaMaxima(
  registros: Array<{ fecha: string; completado: boolean }>,
) {
  const mapa = mapaRegistros(registros)
  const fechas = [...mapa.keys()].sort()

  let actual = 0
  let maxima = 0
  let anterior: string | null = null

  for (const fecha of fechas) {
    const completado = mapa.get(fecha) === true
    if (completado) {
      actual =
        anterior && sumarFecha(anterior, "dia", 1) === fecha ? actual + 1 : 1
      maxima = Math.max(maxima, actual)
    } else {
      actual = 0
    }
    anterior = fecha
  }

  return maxima
}

export function calcularPorcentaje(
  registros: Array<{ fecha: string; completado: boolean }>,
) {
  if (registros.length === 0) return 0
  const completados = registros.filter((registro) => registro.completado).length
  return Math.round((completados / registros.length) * 100)
}

export function estadoHabito(
  habito: Habito,
  registros: HabitoRegistro[],
  hoy: string,
): HabitoConEstado {
  const simple: RegistroHabitoSimple[] = registros.map((registro) => ({
    fecha: registro.fecha,
    completado: registro.completado,
  }))
  const mapa = mapaRegistros(simple)
  const ultimos7 = fechasUltimos7(hoy).map((fecha) => ({
    fecha,
    completado: mapa.get(fecha) === true,
  }))
  const registrosUltimoAnio = diasUltimoAnio(hoy).map((fecha) => ({
    fecha,
    completado: mapa.get(fecha) === true,
  }))

  return {
    ...habito,
    completadoHoy: mapa.get(hoy) === true,
    rachaActual: calcularRachaActual(simple, hoy),
    rachaMaxima: calcularRachaMaxima(simple),
    porcentaje: calcularPorcentaje(simple),
    ultimos7,
    registrosUltimoAnio,
    registros,
  }
}

export function calcularResumen(
  habitos: HabitoConEstado[],
  github: GithubActividad[],
): ResumenHabitos {
  const activos = habitos.filter((habito) => habito.activo)
  const commitsGithub = github.reduce(
    (total, dia) => total + dia.commits,
    0,
  )
  const diasConActividad = github.filter(
    (dia) => dia.commits > 0 || dia.pullRequests > 0 || dia.issues > 0,
  ).length

  return {
    activos: activos.length,
    buenos: activos.filter((habito) => habito.tipo === "bueno").length,
    malos: activos.filter((habito) => habito.tipo === "malo").length,
    archivados: habitos.filter((habito) => !habito.activo).length,
    completadosHoy: activos.filter((habito) => habito.completadoHoy).length,
    mejorRacha: Math.max(0, ...activos.map((habito) => habito.rachaActual)),
    commitsGithub,
    diasConActividad,
  }
}

function lunesDe(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number)
  const date = new Date(Date.UTC(anio, mes - 1, dia))
  const diaSemana = date.getUTCDay()
  const offset = diaSemana === 0 ? 6 : diaSemana - 1
  return new Date(date.getTime() - offset * 86_400_000)
    .toISOString()
    .slice(0, 10)
}

export function agruparPorSemanas(fechas: string[]): Array<Array<string | null>> {
  if (fechas.length === 0) return []

  const set = new Set(fechas)
  const inicio = lunesDe(fechas[0])
  const fin = fechas[fechas.length - 1]
  const semanas: Array<Array<string | null>> = []

  let cursor = inicio
  while (cursor <= fin) {
    const semana: Array<string | null> = []
    for (let indice = 0; indice < 7; indice += 1) {
      const fecha = sumarFecha(cursor, "dia", indice)
      semana.push(set.has(fecha) ? fecha : null)
    }
    semanas.push(semana)
    cursor = sumarFecha(cursor, "dia", 7)
  }

  return semanas
}

export function habitosDeHoy(
  habitos: HabitoConEstado[],
  hoy: string,
): Array<{
  id: number
  titulo: string
  emoji: string | null
  color: string
  completado: boolean
}> {
  return habitos
    .filter((habito) => habito.activo)
    .map((habito) => ({
      id: habito.id,
      titulo: habito.titulo,
      emoji: habito.emoji,
      color: habito.color,
      completado: habito.registros.some(
        (registro) => registro.fecha === hoy && registro.completado,
      ),
    }))
}
