"use server";

import { requireAuthorizedUser } from "@/lib/auth";

import { db } from "@/db";
import { animesVistos } from "@/modules/animes/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { invalidarCacheAnimes } from "@/modules/animes/lib/cache";

const estadoSchema = z.enum(["planeado", "viendo", "completado", "en_pausa", "abandonado"]);

export async function actualizarEstadoAnimes(
  ids: number[],
  estado: z.infer<typeof estadoSchema>,
) {
  await requireAuthorizedUser();

  const idsValidos = Array.from(new Set(ids.filter((n) => Number.isInteger(n) && n > 0)));
  if (idsValidos.length === 0) return { error: "Sin selección" };

  const parsed = estadoSchema.safeParse(estado);
  if (!parsed.success) return { error: "Estado inválido" };

  await db
    .update(animesVistos)
    .set({ estado: parsed.data, actualizadoEn: new Date().toISOString() })
    .where(inArray(animesVistos.id, idsValidos));

  invalidarCacheAnimes();
  revalidatePath("/animes");

  return { success: true, actualizados: idsValidos.length };
}

export async function eliminarAnimes(ids: number[]) {
  await requireAuthorizedUser();

  const idsValidos = Array.from(new Set(ids.filter((n) => Number.isInteger(n) && n > 0)));
  if (idsValidos.length === 0) return { error: "Sin selección" };

  await db.delete(animesVistos).where(inArray(animesVistos.id, idsValidos));

  invalidarCacheAnimes();
  revalidatePath("/animes");

  return { success: true, eliminados: idsValidos.length };
}

export async function agregarTagAnimes(ids: number[], tag: string) {
  await requireAuthorizedUser();

  const idsValidos = Array.from(new Set(ids.filter((n) => Number.isInteger(n) && n > 0)));
  if (idsValidos.length === 0) return { error: "Sin selección" };

  const tagNormalizado = tag.trim().toLowerCase();
  if (!tagNormalizado || tagNormalizado.length > 40) {
    return { error: "Tag inválido" };
  }

  const animes = await db
    .select()
    .from(animesVistos)
    .where(inArray(animesVistos.id, idsValidos));

  for (const anime of animes) {
    const tagsActuales = Array.isArray(anime.tags) ? anime.tags : [];
    if (tagsActuales.includes(tagNormalizado)) continue;
    await db
      .update(animesVistos)
      .set({
        tags: [...tagsActuales, tagNormalizado],
        actualizadoEn: new Date().toISOString(),
      })
      .where(eq(animesVistos.id, anime.id));
  }

  invalidarCacheAnimes();
  revalidatePath("/animes");

  return { success: true };
}