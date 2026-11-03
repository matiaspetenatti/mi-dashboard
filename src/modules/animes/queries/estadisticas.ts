import { db } from "@/db";
import { animesVistos } from "@/modules/animes/schema";
import { and, avg, count, desc, eq, sql } from "drizzle-orm";

export type ConteoEstado = { estado: string; total: number };
export type ConteoAno = { ano: number; total: number };
export type ConteoGenero = { genero: string; total: number };
export type ConteoTexto = { valor: string; total: number };
export type PromedioGenero = { genero: string; promedio: number; total: number };
export type TopAnime = { id: number; titulo: string; miPuntaje: number | null; scoreMal: number | null };
export type ComparativaScore = { titulo: string; miPuntaje: number; scoreMal: number };

export async function animesPorEstado(): Promise<ConteoEstado[]> {
  const rows = await db
    .select({ estado: animesVistos.estado, total: count() })
    .from(animesVistos)
    .groupBy(animesVistos.estado);
  return rows.map((r) => ({ estado: r.estado, total: Number(r.total) }));
}

export async function animesPorAno(): Promise<ConteoAno[]> {
  const rows = await db
    .select({ ano: animesVistos.ano, total: count() })
    .from(animesVistos)
    .where(sql`${animesVistos.ano} IS NOT NULL`)
    .groupBy(animesVistos.ano)
    .orderBy(desc(animesVistos.ano));
  return rows
    .filter((r) => r.ano !== null)
    .map((r) => ({ ano: Number(r.ano), total: Number(r.total) }));
}

export async function animesPorGenero(): Promise<ConteoGenero[]> {
  const rows = await db.all<{ genero: string; total: number }>(
    sql`select json_each.value as genero, count(*) as total
        from ${animesVistos}, json_each(${animesVistos.generos})
        where json_each.value is not null and json_each.value <> ''
        group by json_each.value
        order by total desc`,
  );
  return rows.map((r) => ({ genero: r.genero, total: Number(r.total) }));
}

export async function animesPorEstudio(): Promise<ConteoTexto[]> {
  const rows = await db
    .select({ valor: animesVistos.estudio, total: count() })
    .from(animesVistos)
    .where(sql`${animesVistos.estudio} IS NOT NULL AND ${animesVistos.estudio} <> ''`)
    .groupBy(animesVistos.estudio)
    .orderBy(desc(count()));
  return rows
    .filter((r) => r.valor)
    .map((r) => ({ valor: String(r.valor), total: Number(r.total) }));
}

export async function animesPorFuente(): Promise<ConteoTexto[]> {
  const rows = await db
    .select({ valor: animesVistos.fuente, total: count() })
    .from(animesVistos)
    .where(sql`${animesVistos.fuente} IS NOT NULL AND ${animesVistos.fuente} <> ''`)
    .groupBy(animesVistos.fuente)
    .orderBy(desc(count()));
  return rows
    .filter((r) => r.valor)
    .map((r) => ({ valor: String(r.valor), total: Number(r.total) }));
}

export async function animesPorFormato(): Promise<ConteoTexto[]> {
  const rows = await db
    .select({ valor: animesVistos.formato, total: count() })
    .from(animesVistos)
    .where(sql`${animesVistos.formato} IS NOT NULL AND ${animesVistos.formato} <> ''`)
    .groupBy(animesVistos.formato)
    .orderBy(desc(count()));
  return rows
    .filter((r) => r.valor)
    .map((r) => ({ valor: String(r.valor), total: Number(r.total) }));
}

export async function promedioPorGenero(): Promise<PromedioGenero[]> {
  const rows = await db.all<{ genero: string; promedio: number; total: number }>(
    sql`select json_each.value as genero,
               avg(${animesVistos.miPuntaje}) as promedio,
               count(*) as total
        from ${animesVistos}, json_each(${animesVistos.generos})
        where json_each.value is not null
          and json_each.value <> ''
          and ${animesVistos.miPuntaje} is not null
        group by json_each.value
        having count(*) >= 2
        order by promedio desc`,
  );
  return rows.map((r) => ({
    genero: r.genero,
    promedio: Number(r.promedio?.toFixed?.(1) ?? r.promedio),
    total: Number(r.total),
  }));
}

export async function topAnimes(limite = 10): Promise<TopAnime[]> {
  const rows = await db
    .select({
      id: animesVistos.id,
      titulo: animesVistos.titulo,
      tituloIngles: animesVistos.tituloIngles,
      miPuntaje: animesVistos.miPuntaje,
      scoreMal: animesVistos.scoreMal,
    })
    .from(animesVistos)
    .where(sql`${animesVistos.miPuntaje} IS NOT NULL`)
    .orderBy(desc(animesVistos.miPuntaje))
    .limit(limite);
  return rows.map((r) => ({
    id: r.id,
    titulo: r.tituloIngles || r.titulo,
    miPuntaje: r.miPuntaje,
    scoreMal: r.scoreMal,
  }));
}

export async function comparativaScores(): Promise<ComparativaScore[]> {
  const rows = await db
    .select({
      titulo: animesVistos.titulo,
      tituloIngles: animesVistos.tituloIngles,
      miPuntaje: animesVistos.miPuntaje,
      scoreMal: animesVistos.scoreMal,
    })
    .from(animesVistos)
    .where(
      and(
        sql`${animesVistos.miPuntaje} IS NOT NULL`,
        sql`${animesVistos.scoreMal} IS NOT NULL`,
      ),
    );
  return rows.map((r) => ({
    titulo: r.tituloIngles || r.titulo,
    miPuntaje: Number(r.miPuntaje),
    scoreMal: Number((Number(r.scoreMal) * 10).toFixed(1)),
  }));
}

export async function horasEstimadas() {
  const [row] = await db
    .select({
      episodios: sql<number>`COALESCE(SUM(${animesVistos.episodiosVistos}), 0)`,
    })
    .from(animesVistos);
  const episodios = Number(row?.episodios ?? 0);
  return {
    episodios,
    horas: Math.round((episodios * 24) / 60),
  };
}

export async function mejorGenero() {
  const promedios = await promedioPorGenero();
  if (promedios.length === 0) return null;
  return promedios[0];
}