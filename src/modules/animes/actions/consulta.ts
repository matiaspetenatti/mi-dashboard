"use server";

import { requireAuthorizedUser } from "@/lib/auth";

import { db } from "@/db";
import { animesVistos } from "@/modules/animes/schema";
import { eq } from "drizzle-orm";

export async function obtenerAnimePorId(id: number) {
  await requireAuthorizedUser();

  if (!Number.isInteger(id) || id <= 0) {
    return { error: "ID inválido" };
  }

  const [anime] = await db
    .select()
    .from(animesVistos)
    .where(eq(animesVistos.id, id))
    .limit(1);

  if (!anime) return { error: "Anime no encontrado" };
  return { anime };
}