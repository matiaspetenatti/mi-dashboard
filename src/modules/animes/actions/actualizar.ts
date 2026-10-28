"use server";

import { requireAuthorizedUser } from "@/lib/auth";

import { db } from "@/db";
import { animesVistos } from "@/modules/animes/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
import { z } from "zod";
import {
  aColumnasPuntaje,
  calcularTotalPuntajes,
} from "@/modules/animes/lib/criterios";
import { leerPuntajesFormData } from "./_puntajes";

const ANIMES_TAG = "animes";

const invalidarCacheAnimes = () => {
  updateTag(ANIMES_TAG);
};

const parseNumero = (raw: FormDataEntryValue | null): number | null => {
  if (raw === null || raw === "") return null;
  const numero = Number(raw);
  return Number.isFinite(numero) ? numero : Number.NaN;
};

const actualizarSchema = z.object({
  id: z.coerce.number().int().positive(),
  estado: z.enum(["viendo", "completado", "en_pausa", "abandonado"]),
  notas: z.string().nullable(),
  rewatch: z.boolean(),
  episodiosVistos: z.number().int().min(0).optional(),
});

export async function actualizarAnimeVisto(formData: FormData) {
  await requireAuthorizedUser();
  const id = formData.get("id");

  const parsed = actualizarSchema.safeParse({
    id: Number(id),
    estado: formData.get("estado") || "completado",
    notas: formData.get("notas") || null,
    rewatch: formData.get("rewatch") === "true",
    episodiosVistos:
      formData.get("episodiosVistos") === null ||
      formData.get("episodiosVistos") === ""
        ? undefined
        : parseNumero(formData.get("episodiosVistos")),
  });

  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const puntajes = leerPuntajesFormData(formData);
  if (!puntajes) {
    return { error: "Puntajes inválidos" };
  }

  const data = parsed.data;

  const [anime] = await db
    .select()
    .from(animesVistos)
    .where(eq(animesVistos.id, data.id))
    .limit(1);

  if (!anime) {
    return { error: "Anime no encontrado" };
  }

  let episodiosVistos = anime.episodiosVistos;
  if (data.episodiosVistos !== undefined) {
    const tope =
      anime.episodios && anime.episodios > 0
        ? anime.episodios
        : data.episodiosVistos;
    episodiosVistos = Math.max(0, Math.min(data.episodiosVistos, tope));
  }

  const cambios: Partial<typeof animesVistos.$inferInsert> = {
    estado: data.estado,
    notas: data.notas,
    rewatch: data.rewatch,
    episodiosVistos,
    actualizadoEn: new Date().toISOString(),
  };

  // Si no hay ningún criterio calificado, no pisamos un puntaje anterior
  // sin desglose (los animes viejos guardaban solo el total).
  const hayPuntajes = Object.values(puntajes).some(
    (valor) => valor !== null,
  );
  if (hayPuntajes) {
    Object.assign(cambios, aColumnasPuntaje(puntajes));
    cambios.miPuntaje = calcularTotalPuntajes(puntajes);
  }

  await db
    .update(animesVistos)
    .set(cambios)
    .where(eq(animesVistos.id, data.id));

  invalidarCacheAnimes();
  revalidatePath("/animes");
  return { success: true };
}

export async function eliminarAnimeVisto(id: number) {
  await requireAuthorizedUser();
  await db.delete(animesVistos).where(eq(animesVistos.id, id));
  invalidarCacheAnimes();
  revalidatePath("/animes");
  return { success: true };
}
