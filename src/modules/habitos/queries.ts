"use server";

import { cache } from "react";
import {
  asc,
  and,
  desc,
  eq,
  gte,
  lte,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import {
  habitos,
  habitoRegistros,
  githubActividad,
  type Habito,
  type HabitoRegistro,
  type GithubActividad,
} from "./schema";

/**
 * Lista todos los hábitos activos (o todos si se pide).
 */
export const getHabitos = cache(
  async (soloActivos = true): Promise<Habito[]> => {
    try {
      const filas = await db
        .select()
        .from(habitos)
        .where(soloActivos ? eq(habitos.activo, true) : undefined)
        .orderBy(asc(habitos.creadoEn));

      return filas;
    } catch (error) {
      console.error("No se pudieron leer los hábitos:", error);
      return [];
    }
  },
);

/**
 * Obtiene un hábito por su ID.
 */
export const getHabitoPorId = cache(
  async (id: number): Promise<Habito | null> => {
    try {
      const [fila] = await db
        .select()
        .from(habitos)
        .where(eq(habitos.id, id))
        .limit(1);
      return fila ?? null;
    } catch (error) {
      console.error("No se pudo leer el hábito:", error);
      return null;
    }
  },
);

/**
 * Registros de un hábito en un rango de fechas.
 */
export const getRegistrosHabito = cache(
  async (
    habitoId: number,
    fechaDesde?: string,
    fechaHasta?: string,
  ): Promise<HabitoRegistro[]> => {
    try {
      const condiciones: SQL[] = [eq(habitoRegistros.habitoId, habitoId)];

      if (fechaDesde) {
        condiciones.push(gte(habitoRegistros.fecha, fechaDesde));
      }
      if (fechaHasta) {
        condiciones.push(lte(habitoRegistros.fecha, fechaHasta));
      }

      const filas = await db
        .select()
        .from(habitoRegistros)
        .where(and(...condiciones))
        .orderBy(asc(habitoRegistros.fecha));

      return filas;
    } catch (error) {
      console.error("No se pudieron leer los registros del hábito:", error);
      return [];
    }
  },
);

/**
 * Registros de todos los hábitos para una fecha específica (ej. hoy).
 */
export const getRegistrosPorFecha = cache(
  async (fecha: string): Promise<HabitoRegistro[]> => {
    try {
      const filas = await db
        .select()
        .from(habitoRegistros)
        .where(eq(habitoRegistros.fecha, fecha))
        .orderBy(asc(habitoRegistros.habitoId));

      return filas;
    } catch (error) {
      console.error("No se pudieron leer los registros de la fecha:", error);
      return [];
    }
  },
);

/**
 * Último año de registros para un hábito (para el heatmap).
 */
export const getRegistrosUltimoAnio = cache(
  async (habitoId: number): Promise<HabitoRegistro[]> => {
    const haceUnAnio = new Date();
    haceUnAnio.setFullYear(haceUnAnio.getFullYear() - 1);
    const fechaDesde = haceUnAnio.toISOString().slice(0, 10);

    return getRegistrosHabito(habitoId, fechaDesde);
  },
);

/**
 * Actividad de GitHub guardada (caché).
 */
export const getGithubActividad = cache(
  async (): Promise<GithubActividad[]> => {
    try {
      const filas = await db
        .select()
        .from(githubActividad)
        .orderBy(desc(githubActividad.fecha));
      return filas;
    } catch (error) {
      console.error("No se pudo leer la actividad de GitHub:", error);
      return [];
    }
  },
);

/**
 * Actividad de GitHub para una fecha específica.
 */
export const getGithubActividadPorFecha = cache(
  async (fecha: string): Promise<GithubActividad | null> => {
    try {
      const [fila] = await db
        .select()
        .from(githubActividad)
        .where(eq(githubActividad.fecha, fecha))
        .limit(1);
      return fila ?? null;
    } catch (error) {
      console.error("No se pudo leer la actividad de GitHub:", error);
      return null;
    }
  },
);

export type { Habito, HabitoRegistro, GithubActividad };
