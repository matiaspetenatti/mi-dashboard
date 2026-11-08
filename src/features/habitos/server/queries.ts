import "@tanstack/react-start/server-only"

import { asc, desc, gte } from "drizzle-orm"

import { fechaHoy, sumarFecha } from "@/lib/dates"
import { getDb } from "@/server/db/client"
import {
  githubActividad,
  habitoRegistros,
  habitos,
  type HabitoRegistro,
} from "@/server/db/schema"
import {
  calcularResumen,
  estadoHabito,
  habitosDeHoy,
} from "../lib/habitos"
import type {
  ResumenHabitosWidget,
  WorkspaceHabitos,
} from "../types"

function agruparRegistros(registros: HabitoRegistro[]) {
  const mapa = new Map<number, HabitoRegistro[]>()
  for (const registro of registros) {
    const lista = mapa.get(registro.habitoId) ?? []
    lista.push(registro)
    mapa.set(registro.habitoId, lista)
  }
  return mapa
}

export async function obtenerWorkspaceHabitos(): Promise<WorkspaceHabitos> {
  const db = getDb()
  const hoy = fechaHoy()
  const desde = sumarFecha(hoy, "dia", -364)

  const [filasHabitos, filasRegistros, filasGithub] = await Promise.all([
    db.select().from(habitos).orderBy(asc(habitos.creadoEn)),
    db
      .select()
      .from(habitoRegistros)
      .where(gte(habitoRegistros.fecha, desde))
      .orderBy(asc(habitoRegistros.fecha)),
    db
      .select()
      .from(githubActividad)
      .orderBy(desc(githubActividad.fecha)),
  ])

  const registrosPorHabito = agruparRegistros(filasRegistros)
  const habitosConEstado = filasHabitos.map((habito) =>
    estadoHabito(habito, registrosPorHabito.get(habito.id) ?? [], hoy),
  )

  return {
    hoy,
    habitos: habitosConEstado,
    resumen: calcularResumen(habitosConEstado, filasGithub),
    github: filasGithub,
  }
}

export async function obtenerResumenHabitos(): Promise<ResumenHabitosWidget> {
  const workspace = await obtenerWorkspaceHabitos()

  return {
    activos: workspace.resumen.activos,
    completadosHoy: workspace.resumen.completadosHoy,
    mejorRacha: workspace.resumen.mejorRacha,
    commitsGithub: workspace.resumen.commitsGithub,
    habitosHoy: habitosDeHoy(workspace.habitos, workspace.hoy),
  }
}
