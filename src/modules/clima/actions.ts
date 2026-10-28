"use server";

import { requireAuthorizedUser } from "@/lib/auth";
import { db } from "@/db";
import { asc, eq, ne } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { climaUbicacion } from "./schema";
import { CLIMA_TAG, MAX_UBICACIONES_CLIMA } from "./constantes";

const ubicacionSchema = z.object({
  etiqueta: z.string().trim().max(80).optional().nullable(),
  latitud: z.coerce.number().min(-90).max(90),
  longitud: z.coerce.number().min(-180).max(180),
});

const idSchema = z.coerce.number().int().positive();

export type ResultadoUbicacion =
  | { ok: true; id?: number }
  | { ok: false; error: string };

export type ResultadoEliminarUbicacion =
  | { ok: true }
  | { ok: false; error: string };

/** Misma ubicación si coincide a tres decimales (~100 m). */
function coordenadaClave(valor: number) {
  return Math.round(valor * 1000) / 1000;
}

function revalidarClima() {
  updateTag(CLIMA_TAG);
  revalidatePath("/clima");
  revalidatePath("/");
}

/**
 * Guarda una ubicación y la deja activa.
 * Si ya existe (mismas coordenadas) actualiza su etiqueta y la activa.
 */
export async function guardarUbicacionClima(datos: {
  etiqueta?: string | null;
  latitud: number;
  longitud: number;
}): Promise<ResultadoUbicacion> {
  await requireAuthorizedUser();

  const parsed = ubicacionSchema.safeParse(datos);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Las coordenadas no son válidas. Revisá latitud y longitud.",
    };
  }

  const etiqueta = parsed.data.etiqueta?.trim() || null;
  const latitud = coordenadaClave(parsed.data.latitud);
  const longitud = coordenadaClave(parsed.data.longitud);
  const actualizadoEn = new Date().toISOString();

  try {
    const filas = await db.select().from(climaUbicacion);

    const existente = filas.find(
      (fila) =>
        coordenadaClave(fila.latitud) === latitud &&
        coordenadaClave(fila.longitud) === longitud,
    );

    if (existente) {
      await db.batch([
        db
          .update(climaUbicacion)
          .set({ esActiva: false })
          .where(eq(climaUbicacion.esActiva, true)),
        db
          .update(climaUbicacion)
          .set({
            etiqueta: etiqueta ?? existente.etiqueta,
            esActiva: true,
            actualizadoEn,
          })
          .where(eq(climaUbicacion.id, existente.id)),
      ]);

      revalidarClima();
      return { ok: true, id: existente.id };
    }

    if (filas.length >= MAX_UBICACIONES_CLIMA) {
      return {
        ok: false,
        error: `Llegaste al máximo de ${MAX_UBICACIONES_CLIMA} ubicaciones. Eliminá una para agregar otra.`,
      };
    }

    const [, insertadas] = await db.batch([
      db
        .update(climaUbicacion)
        .set({ esActiva: false })
        .where(eq(climaUbicacion.esActiva, true)),
      db
        .insert(climaUbicacion)
        .values({ etiqueta, latitud, longitud, esActiva: true, actualizadoEn })
        .returning({ id: climaUbicacion.id }),
    ]);

    revalidarClima();
    return { ok: true, id: insertadas[0]?.id };
  } catch (error) {
    console.error("No se pudo guardar la ubicación del clima:", error);
    return { ok: false, error: "No se pudo guardar la ubicación" };
  }
}

/** Cambia la ubicación activa sin tocar el resto. */
export async function activarUbicacionClima(
  id: number,
): Promise<ResultadoUbicacion> {
  await requireAuthorizedUser();

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return { ok: false, error: "La ubicación no es válida." };
  }

  try {
    const [fila] = await db
      .select({ id: climaUbicacion.id, esActiva: climaUbicacion.esActiva })
      .from(climaUbicacion)
      .where(eq(climaUbicacion.id, parsed.data));

    if (!fila) {
      return { ok: false, error: "Esa ubicación ya no existe." };
    }

    if (fila.esActiva) return { ok: true, id: fila.id };

    await db.batch([
      db
        .update(climaUbicacion)
        .set({ esActiva: false })
        .where(eq(climaUbicacion.esActiva, true)),
      db
        .update(climaUbicacion)
        .set({ esActiva: true, actualizadoEn: new Date().toISOString() })
        .where(eq(climaUbicacion.id, fila.id)),
    ]);

    revalidarClima();
    return { ok: true, id: fila.id };
  } catch (error) {
    console.error("No se pudo activar la ubicación del clima:", error);
    return { ok: false, error: "No se pudo cambiar la ubicación" };
  }
}

/**
 * Elimina una ubicación guardada.
 * Si era la activa, activa la más antigua que quede.
 */
export async function eliminarUbicacionClima(
  id: number,
): Promise<ResultadoEliminarUbicacion> {
  await requireAuthorizedUser();

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return { ok: false, error: "La ubicación no es válida." };
  }

  try {
    const [fila] = await db
      .select({ id: climaUbicacion.id, esActiva: climaUbicacion.esActiva })
      .from(climaUbicacion)
      .where(eq(climaUbicacion.id, parsed.data));

    if (!fila) {
      return { ok: false, error: "Esa ubicación ya no existe." };
    }

    if (fila.esActiva) {
      const [siguiente] = await db
        .select({ id: climaUbicacion.id })
        .from(climaUbicacion)
        .where(ne(climaUbicacion.id, fila.id))
        .orderBy(asc(climaUbicacion.id))
        .limit(1);

      if (siguiente) {
        await db.batch([
          db.delete(climaUbicacion).where(eq(climaUbicacion.id, fila.id)),
          db
            .update(climaUbicacion)
            .set({ esActiva: true, actualizadoEn: new Date().toISOString() })
            .where(eq(climaUbicacion.id, siguiente.id)),
        ]);
      } else {
        await db.delete(climaUbicacion).where(eq(climaUbicacion.id, fila.id));
      }
    } else {
      await db.delete(climaUbicacion).where(eq(climaUbicacion.id, fila.id));
    }

    revalidarClima();
    return { ok: true };
  } catch (error) {
    console.error("No se pudo eliminar la ubicación del clima:", error);
    return { ok: false, error: "No se pudo eliminar la ubicación" };
  }
}
