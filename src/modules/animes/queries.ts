"use server";

import { requireAuthorizedUser } from "@/lib/auth";

import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { ANIMES_POR_PAGINA, animesVistos } from "./schema";
import type { AnimeMetadatos, AnimesPaginadosResult } from "./schema";
import { and, asc, count, desc, gte, lte, sql, type SQL } from "drizzle-orm";
import { obtenerTemporadaAnime } from "./utils";

const ANIMES_TAG = "animes";

const ANIMES_LIMITE_MAXIMO = 50;

function normalizarPagina(pagina?: number) {
  return typeof pagina === "number" && Number.isFinite(pagina) && pagina > 0
    ? Math.trunc(pagina)
    : 1;
}

function normalizarLimite(limite?: number) {
  return typeof limite === "number" && Number.isFinite(limite) && limite > 0
    ? Math.min(ANIMES_LIMITE_MAXIMO, Math.trunc(limite))
    : ANIMES_POR_PAGINA;
}

export type AnimesFiltros = {
  estado?: "viendo" | "completado" | "en_pausa" | "abandonado" | "todos";
  tipo?: string;
  genero?: string;
  anoDesde?: number;
  anoHasta?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  ordenarPor?: "puntaje_desc" | "puntaje_asc" | "fecha_emision_desc" | "fecha_emision_asc" | "agregado_desc" | "agregado_asc" | "titulo_asc";
  q?: string;
  temporada?: string;
  pagina?: number;
  limite?: number;
};

function ordenarAnimes(ordenarPor: AnimesFiltros["ordenarPor"]) {
  switch (ordenarPor) {
    case "titulo_asc":
      return [
        sql`${animesVistos.titulo} COLLATE NOCASE`,
        desc(animesVistos.id),
      ];
    case "fecha_emision_asc":
      return [
        sql`${animesVistos.fechaEmision} IS NULL`,
        asc(animesVistos.fechaEmision),
        desc(animesVistos.id),
      ];
    case "fecha_emision_desc":
      return [
        sql`${animesVistos.fechaEmision} IS NULL`,
        desc(animesVistos.fechaEmision),
        desc(animesVistos.id),
      ];
    case "agregado_asc":
      return [asc(animesVistos.agregadoEn), desc(animesVistos.id)];
    case "agregado_desc":
      return [desc(animesVistos.agregadoEn), desc(animesVistos.id)];
    case "puntaje_asc":
      return [
        sql`${animesVistos.miPuntaje} IS NULL`,
        asc(animesVistos.miPuntaje),
        desc(animesVistos.agregadoEn),
        desc(animesVistos.id),
      ];
    default:
      return [
        sql`${animesVistos.miPuntaje} IS NULL`,
        desc(animesVistos.miPuntaje),
        desc(animesVistos.agregadoEn),
        desc(animesVistos.id),
      ];
  }
}

async function leerAnimesVistos(
  filtros: AnimesFiltros = {},
): Promise<AnimesPaginadosResult> {
  const condiciones: (SQL | undefined)[] = [];

  if (filtros.estado && filtros.estado !== "todos") {
    condiciones.push(sql`${animesVistos.estado} = ${filtros.estado}`);
  }

  if (filtros.tipo) {
    condiciones.push(sql`${animesVistos.tipo} = ${filtros.tipo}`);
  }

  if (filtros.anoDesde) {
    condiciones.push(gte(animesVistos.ano, filtros.anoDesde));
  }

  if (filtros.anoHasta) {
    condiciones.push(lte(animesVistos.ano, filtros.anoHasta));
  }

  if (filtros.fechaDesde) {
    condiciones.push(gte(animesVistos.fechaEmision, filtros.fechaDesde));
  }

  if (filtros.fechaHasta) {
    condiciones.push(lte(animesVistos.fechaEmision, filtros.fechaHasta));
  }

  if (filtros.q && filtros.q.trim()) {
    const q = "%" + filtros.q.trim() + "%";
    condiciones.push(sql`(${animesVistos.titulo} LIKE ${q} OR ${animesVistos.tituloIngles} LIKE ${q})`);
  }

  if (filtros.genero) {
    condiciones.push(sql`${animesVistos.generos} LIKE ${"%" + filtros.genero + "%"}`);
  }

  if (filtros.temporada) {
    const [temp, añoStr] = filtros.temporada.split("-");
    const año = Number(añoStr);
    if (temp && !Number.isNaN(año)) {
      if (temp === "invierno") {
        condiciones.push(and(gte(animesVistos.fechaEmision, `${año}-01-01`), lte(animesVistos.fechaEmision, `${año}-03-31`)));
      } else if (temp === "primavera") {
        condiciones.push(and(gte(animesVistos.fechaEmision, `${año}-04-01`), lte(animesVistos.fechaEmision, `${año}-06-30`)));
      } else if (temp === "verano") {
        condiciones.push(and(gte(animesVistos.fechaEmision, `${año}-07-01`), lte(animesVistos.fechaEmision, `${año}-09-30`)));
      } else if (temp === "otoño") {
        condiciones.push(and(gte(animesVistos.fechaEmision, `${año}-10-01`), lte(animesVistos.fechaEmision, `${año}-12-31`)));
      }
    }
  }

  const whereClause = condiciones.length > 0 ? and(...condiciones) : undefined;

  const [{ total: totalRaw }] = await db
    .select({ total: count() })
    .from(animesVistos)
    .where(whereClause);

  const total = Number(totalRaw ?? 0);
  const limite = normalizarLimite(filtros.limite);
  const totalPaginas = Math.max(1, Math.ceil(total / limite));
  const pagina = Math.min(normalizarPagina(filtros.pagina), totalPaginas);
  const offset = (pagina - 1) * limite;

  const animes = await db
    .select()
    .from(animesVistos)
    .where(whereClause)
    .orderBy(...ordenarAnimes(filtros.ordenarPor))
    .limit(limite)
    .offset(offset);

  return {
    animes,
    total,
    pagina,
    limite,
    totalPaginas,
  };
}

const getAnimesVistosCache = cache(async (filtros: AnimesFiltros = {}) => {
  "use cache";
  cacheLife("minutes");
  cacheTag(ANIMES_TAG);

  return leerAnimesVistos(filtros);
});

export async function getAnimesVistos(filtros: AnimesFiltros = {}) {
  return getAnimesVistosCache({
    ...filtros,
    pagina: normalizarPagina(filtros.pagina),
    limite: normalizarLimite(filtros.limite),
  });
}

async function leerAnimesMetadatos(): Promise<AnimeMetadatos> {
  const [tiposRows, anosRows, fechasRows, generosRows] = await Promise.all([
    db.selectDistinct({ tipo: animesVistos.tipo }).from(animesVistos),
    db.selectDistinct({ ano: animesVistos.ano }).from(animesVistos),
    db
      .selectDistinct({ fechaEmision: animesVistos.fechaEmision })
      .from(animesVistos),
    db.all<{ genero: string }>(
      sql`select distinct json_each.value as genero
          from ${animesVistos}, json_each(${animesVistos.generos})
          where json_each.value is not null and json_each.value <> ''`,
    ),
  ]);

  const tipos = tiposRows
    .flatMap((r) => (r.tipo ? [r.tipo] : []))
    .sort();

  const anos = anosRows
    .flatMap((r) => (r.ano ? [r.ano] : []))
    .sort((a, b) => b - a);

  const generos = generosRows.map((r) => r.genero).sort();

  const temporadas = new Map<
    string,
    { key: string; label: string; año: number; temporada: string }
  >();

  for (const r of fechasRows) {
    const temp = obtenerTemporadaAnime(r.fechaEmision);
    if (temp && !temporadas.has(temp.key)) {
      temporadas.set(temp.key, {
        key: temp.key,
        label: temp.label,
        año: temp.año,
        temporada: temp.temporada,
      });
    }
  }

  const temporadasList = Array.from(temporadas.values()).sort((a, b) => {
    if (a.año !== b.año) return b.año - a.año;

    // Ciclo de temporadas: otoño → invierno → primavera → verano.
    // Dentro del mismo año mostramos primero las más recientes.
    const ordenTemporadas: Record<string, number> = {
      otoño: 0,
      invierno: 1,
      primavera: 2,
      verano: 3,
    };

    return (
      (ordenTemporadas[b.temporada] ?? 0) -
      (ordenTemporadas[a.temporada] ?? 0)
    );
  });

  return {
    tipos,
    generos,
    anos,
    temporadas: temporadasList,
  };
}

const getAnimesMetadatosCache = cache(async () => {
  "use cache";
  cacheLife("minutes");
  cacheTag(ANIMES_TAG);

  return leerAnimesMetadatos();
});

export async function getAnimesMetadatos() {
  return getAnimesMetadatosCache();
}
