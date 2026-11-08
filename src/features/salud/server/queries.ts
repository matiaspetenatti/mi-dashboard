import "@tanstack/react-start/server-only"

import { desc, gte, inArray } from "drizzle-orm"

import { fechaHoy } from "@/lib/dates"
import { getDb } from "@/server/db/client"
import {
  saludEpisodios,
  saludEpisodioDesencadenantes,
  saludRegistrosDiarios,
} from "@/server/db/schema"
import { DIAS_ANALISIS } from "../constantes"
import { calcularResumenSalud, calcularResumenWidget } from "../lib/calculo"
import { fechaHoraAhora, sumarDias } from "../lib/fechas"
import type {
  EpisodioConFactores,
  ResumenSaludWidget,
  WorkspaceSalud,
} from "../types"

export async function obtenerWorkspaceSalud(): Promise<WorkspaceSalud> {
  const db = getDb()
  const hoy = fechaHoy()
  const desdeAnalisis = sumarDias(hoy, -(DIAS_ANALISIS - 1))

  const [filasEpisodios, filasDiario] = await Promise.all([
    db
      .select()
      .from(saludEpisodios)
      .orderBy(desc(saludEpisodios.inicioEn))
      .limit(500),
    db
      .select()
      .from(saludRegistrosDiarios)
      .where(gte(saludRegistrosDiarios.fecha, desdeAnalisis))
      .orderBy(desc(saludRegistrosDiarios.fecha)),
  ])

  const ids = filasEpisodios.map((episodio) => episodio.id)
  const filasFactores =
    ids.length > 0
      ? await db
          .select()
          .from(saludEpisodioDesencadenantes)
          .where(inArray(saludEpisodioDesencadenantes.episodioId, ids))
      : []

  const factoresPorEpisodio = new Map<number, string[]>()
  for (const fila of filasFactores) {
    const lista = factoresPorEpisodio.get(fila.episodioId) ?? []
    lista.push(fila.factor)
    factoresPorEpisodio.set(fila.episodioId, lista)
  }

  const episodios: EpisodioConFactores[] = filasEpisodios.map((episodio) => ({
    ...episodio,
    factores: factoresPorEpisodio.get(episodio.id) ?? [],
  }))

  return {
    hoy,
    ahora: fechaHoraAhora(),
    episodios,
    diario: filasDiario,
    ...calcularResumenSalud({ hoy, episodios, diario: filasDiario }),
  }
}

export async function obtenerResumenSalud(): Promise<ResumenSaludWidget> {
  const db = getDb()
  const hoy = fechaHoy()

  const filasEpisodios = await db
    .select()
    .from(saludEpisodios)
    .orderBy(desc(saludEpisodios.inicioEn))

  const episodios: EpisodioConFactores[] = filasEpisodios.map((episodio) => ({
    ...episodio,
    factores: [],
  }))

  return calcularResumenWidget(hoy, episodios)
}
