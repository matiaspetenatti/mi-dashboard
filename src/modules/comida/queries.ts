import "server-only";

import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, desc, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { fechaHoy } from "@/lib/format";
import { COMIDA_TAG } from "./constantes";
import { diasDeSemana, inicioSemana } from "./lib/semana";
import { porVencer } from "./lib/inventario";
import {
  comidaIngredientes,
  comidaLista,
  comidaMenu,
  comidaRecetas,
  type ItemComida,
  type ItemListaComida,
  type RecetaComida,
  type SlotMenuComida,
} from "./schema";

export type ResumenComida = {
  hoy: string;
  /** Lunes de la semana consultada. */
  semana: string;
  dias: string[];
  items: ItemComida[];
  recetas: RecetaComida[];
  menu: SlotMenuComida[];
  lista: ItemListaComida[];
  kpis: {
    items: number;
    porVencer: number;
    recetas: number;
    comprasPendientes: number;
    totalCompraCentavos: number;
  };
};

async function leerComida(semana: string): Promise<ResumenComida> {
  const hoy = fechaHoy();
  const inicio = inicioSemana(semana);
  const dias = diasDeSemana(inicio);
  const fin = dias[dias.length - 1];

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
  ]);

  const comprasPendientes = lista.filter((item) => !item.comprado);

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
  };
}

const getComidaCache = cache(async (semana: string) => {
  "use cache";
  cacheLife("minutes");
  cacheTag(COMIDA_TAG);

  return leerComida(semana);
});

export async function getComida(semana: string) {
  return getComidaCache(inicioSemana(semana));
}

/** Slots de un día puntual, para el widget y la vista de menú. */
export function menuDelDia(menu: SlotMenuComida[], dia: string) {
  return menu.filter((slot) => slot.dia === dia);
}
