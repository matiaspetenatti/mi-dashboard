"use server";

import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { and, asc, count, desc, gte, lte, sql, type SQL } from "drizzle-orm";
import {
  ANIMES_POR_PAGINA,
  animesVistos,
  type AnimesPaginadosResult,
} from "@/modules/animes/schema";


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
  estado?: "planeado" | "viendo" | "completado" | "en_pausa" | "abandonado" | "todos";
  tipo?: string;
  genero?: string;
  anoDesde?: number;
  anoHasta?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  ordenarPor?:
    | "puntaje_desc"
    | "puntaje_asc"
    | "fecha_emision_desc"
    | "fecha_emision_asc"
    | "agregado_desc"
    | "agregado_asc"
    | "titulo_asc"
    | "titulo_desc"
    | "progreso_desc"
    | "score_mal_desc"
    | "episodios_desc"
    | "favorito_desc";
  q?: string;
  temporada?: string;
  pagina?: number;
  limite?: number;
  favorito?: boolean;
  estudio?: string;
  fuente?: string;
  formato?: string;
  tags?: string[];
  puntajeMin?: number;
  puntajeMax?: number;
  scoreMalMin?: number;
  scoreMalMax?: number;
};

function ordenarAnimes(ordenarPor: AnimesFiltros["ordenarPor"]) {
  switch (ordenarPor) {
    case "titulo_asc":
      return [
        sql`${animesVistos.titulo} COLLATE NOCASE`,
        desc(animesVistos.id),
      ];
    case "titulo_desc":
      return [
        sql`${animesVistos.titulo} COLLATE NOCASE DESC`,
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
    case "score_mal_desc":
      return [
        sql`${animesVistos.scoreMal} IS NULL`,
        desc(animesVistos.scoreMal),
        desc(animesVistos.agregadoEn),
        desc(animesVistos.id),
      ];
    case "episodios_desc":
      return [
        sql`${animesVistos.episodios} IS NULL`,
        desc(animesVistos.episodios),
        desc(animesVistos.agregadoEn),
        desc(animesVistos.id),
      ];
    case "progreso_desc":
      return [
        sql`(${animesVistos.episodios} IS NULL OR ${animesVistos.episodios} = 0)`,
        desc(sql`CAST(${animesVistos.episodiosVistos} AS REAL) / NULLIF(${animesVistos.episodios}, 0)`),
        desc(animesVistos.episodiosVistos),
        desc(animesVistos.id),
      ];
    case "favorito_desc":
      return [
        desc(animesVistos.favorito),
        desc(animesVistos.miPuntaje),
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
    condiciones.push(
      sql`(${animesVistos.titulo} LIKE ${q} OR ${animesVistos.tituloIngles} LIKE ${q} OR ${animesVistos.notas} LIKE ${q} OR ${animesVistos.descripcion} LIKE ${q})`,
    );
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

  if (typeof filtros.favorito === "boolean") {
    condiciones.push(sql`${animesVistos.favorito} = ${filtros.favorito}`);
  }

  if (filtros.estudio) {
    condiciones.push(sql`${animesVistos.estudio} = ${filtros.estudio}`);
  }

  if (filtros.fuente) {
    condiciones.push(sql`${animesVistos.fuente} = ${filtros.fuente}`);
  }

  if (filtros.formato) {
    condiciones.push(sql`${animesVistos.formato} = ${filtros.formato}`);
  }

  if (filtros.tags && filtros.tags.length > 0) {
    for (const tag of filtros.tags) {
      condiciones.push(
        sql`EXISTS (SELECT 1 FROM json_each(${animesVistos.tags}) WHERE json_each.value = ${tag})`,
      );
    }
  }

  if (typeof filtros.puntajeMin === "number") {
    condiciones.push(gte(animesVistos.miPuntaje, filtros.puntajeMin));
  }

  if (typeof filtros.puntajeMax === "number") {
    condiciones.push(lte(animesVistos.miPuntaje, filtros.puntajeMax));
  }

  if (typeof filtros.scoreMalMin === "number") {
    condiciones.push(gte(animesVistos.scoreMal, filtros.scoreMalMin));
  }

  if (typeof filtros.scoreMalMax === "number") {
    condiciones.push(lte(animesVistos.scoreMal, filtros.scoreMalMax));
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

export type { AnimesPaginadosResult, PaginacionAnimes } from "../schema";
