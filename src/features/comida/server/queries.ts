import "@tanstack/react-start/server-only"

import { and, asc, desc, eq, gte, lte } from "drizzle-orm"

import { fechaHoy } from "@/lib/dates"
import { getDb } from "@/server/db/client"
import {
  comidaIngredientes,
  comidaLista,
  comidaMenu,
  comidaRecetas,
} from "@/server/db/schema"
import { porVencer } from "../lib/inventario"
import { diasDeSemana, semanaComida } from "../lib/semana"
import type { ResumenComidaWidget, WorkspaceComida } from "../types"

export async function obtenerWorkspaceComida(
  semanaParam?: string,
): Promise<WorkspaceComida> {
  const db = getDb()
  const hoy = fechaHoy()
  const inicio = semanaComida(semanaParam)
  const dias = diasDeSemana(inicio)
  const fin = dias[dias.length - 1]

  const [items, recetas, menu, lista] = await Promise.all([
    db
      .select()
      .from(comidaIngredientes)
      .orderBy(
        asc(comidaIngredientes.categoria),
        asc(comidaIngredientes.nombre),
      ),
    db
      .select()
      .from(comidaRecetas)
      .orderBy(desc(comidaRecetas.favorita), desc(comidaRecetas.creadoEn)),
    db
      .select()
      .from(comidaMenu)
      .where(and(gte(comidaMenu.dia, inicio), lte(comidaMenu.dia, fin)))
      .orderBy(asc(comidaMenu.dia), asc(comidaMenu.momento)),
    db
      .select()
      .from(comidaLista)
      .orderBy(asc(comidaLista.comprado), asc(comidaLista.categoria)),
  ])

  const comprasPendientes = lista.filter((item) => !item.comprado)

  return {
    hoy,
    semana: inicio,
    dias,
    items,
    recetas,
    menu,
    lista,
    kpis: {
      items: items.filter((item) => item.tipo === "ingrediente").length,
      porVencer: porVencer(items, hoy).length,
      recetas: recetas.length,
      comprasPendientes: comprasPendientes.length,
      totalCompraCentavos: comprasPendientes.reduce(
        (total, item) => total + (item.precioCentavos ?? 0),
        0,
      ),
    },
  }
}

export async function obtenerResumenComida(): Promise<ResumenComidaWidget> {
  const db = getDb()
  const hoy = fechaHoy()

  const [items, recetas, lista, menuHoy] = await Promise.all([
    db.select().from(comidaIngredientes),
    db.select({ id: comidaRecetas.id }).from(comidaRecetas),
    db.select().from(comidaLista).where(eq(comidaLista.comprado, false)),
    db
      .select()
      .from(comidaMenu)
      .where(eq(comidaMenu.dia, hoy))
      .orderBy(asc(comidaMenu.momento)),
  ])

  return {
    hoy,
    items: items.filter((item) => item.tipo === "ingrediente").length,
    porVencer: porVencer(items, hoy).length,
    recetas: recetas.length,
    comprasPendientes: lista.length,
    totalCompraCentavos: lista.reduce(
      (total, item) => total + (item.precioCentavos ?? 0),
      0,
    ),
    menuHoy,
  }
}
