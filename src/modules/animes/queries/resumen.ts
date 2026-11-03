import { db } from "@/db";
import { animesVistos } from "@/modules/animes/schema";
import { and, count, eq } from "drizzle-orm";

export type ResumenAnimes = {
  total: number;
  viendo: number;
  planeado: number;
  completado: number;
  enPausa: number;
  abandonado: number;
  favoritos: number;
};

async function contar(condicion?: ReturnType<typeof and>) {
  const [row] = await db
    .select({ total: count() })
    .from(animesVistos)
    .where(condicion);
  return Number(row?.total ?? 0);
}

export async function obtenerResumenAnimes(): Promise<ResumenAnimes> {
  const [
    total,
    viendo,
    planeado,
    completado,
    enPausa,
    abandonado,
    favoritos,
  ] = await Promise.all([
    contar(),
    contar(eq(animesVistos.estado, "viendo")),
    contar(eq(animesVistos.estado, "planeado")),
    contar(eq(animesVistos.estado, "completado")),
    contar(eq(animesVistos.estado, "en_pausa")),
    contar(eq(animesVistos.estado, "abandonado")),
    contar(eq(animesVistos.favorito, true)),
  ]);

  return {
    total,
    viendo,
    planeado,
    completado,
    enPausa,
    abandonado,
    favoritos,
  };
}