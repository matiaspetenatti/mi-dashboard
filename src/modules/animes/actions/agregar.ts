"use server";

import { requireAuthorizedUser } from "@/lib/auth";

import { db } from "@/db";
import { animesVistos, type AnimeVisto } from "@/modules/animes/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
import { z } from "zod";

const ANIMES_TAG = "animes";

const invalidarCacheAnimes = () => {
  updateTag(ANIMES_TAG);
};

const parseNumero = (raw: FormDataEntryValue | null): number | null => {
  if (raw === null || raw === "") return null;
  const numero = Number(raw);
  return Number.isFinite(numero) ? numero : Number.NaN;
};

const leerPuntajes = (formData: FormData) => {
  // This will be passed CRITERIOS_ANIME from the component
  // For now, we'll handle it in the action caller
  return {};
};

const agregarSchema = z.object({
  kitsuId: z.coerce.number().int().positive(),
  titulo: z.string().min(1),
  tituloIngles: z.string().optional().nullable(),
  imagen: z.string().min(1),
  tipo: z.string().optional().nullable(),
  episodios: z.number().int().min(0).optional().nullable(),
  ano: z.number().int().optional().nullable(),
  fechaEmision: z.string().optional().nullable(),
  generos: z.string().optional(),
  descripcion: z.string().optional().nullable(),
  scoreMal: z.number().optional().nullable(),
  estado: z.enum(["viendo", "completado", "en_pausa", "abandonado"]),
  notas: z.string().optional().nullable(),
});

export async function agregarAnime(formData: FormData) {
  await requireAuthorizedUser();
  const kitsuId = formData.get("kitsuId") || formData.get("malId");
  const titulo = String(formData.get("titulo") ?? "");
  const tituloIngles =
    formData.get("tituloIngles") === null ||
    formData.get("tituloIngles") === ""
      ? null
      : String(formData.get("tituloIngles"));
  const imagen = String(formData.get("imagen") ?? "");
  const tipo =
    formData.get("tipo") === null || formData.get("tipo") === ""
      ? null
      : String(formData.get("tipo"));
  const episodios = parseNumero(formData.get("episodios"));
  const ano = parseNumero(formData.get("ano"));
  const fechaEmision =
    formData.get("fechaEmision") === null ||
    formData.get("fechaEmision") === ""
      ? null
      : String(formData.get("fechaEmision"));
  const generosRaw = String(formData.get("generos") ?? "[]");
  const descripcion =
    formData.get("descripcion") === null ||
    formData.get("descripcion") === ""
      ? null
      : String(formData.get("descripcion"));
  const scoreMal = parseNumero(formData.get("scoreMal"));
  const estado = String(formData.get("estado") ?? "completado");
  const notas =
    formData.get("notas") === null || formData.get("notas") === ""
      ? null
      : String(formData.get("notas"));

  let generos: string[] = [];
  try {
    generos = JSON.parse(generosRaw || "[]");
  } catch {
    generos = [];
  }

  const puntajes: Record<string, number | null> = {};
  // Extract scores from form data - this would need CRITERIOS_ANIME import
  // For now, we'll set them as null and let the caller handle validation

  const data = {
    kitsuId: Number(kitsuId),
    titulo,
    tituloIngles,
    imagen,
    tipo,
    episodios,
    ano,
    fechaEmision,
    generos,
    descripcion,
    scoreMal,
    miPuntaje: 0, // Will be calculated
    episodiosVistos: 0,
    estado: estado as AnimeVisto["estado"],
    notas,
    actualizadoEn: new Date().toISOString(),
  };

  try {
    await db.insert(animesVistos).values(data);
    invalidarCacheAnimes();
    revalidatePath("/animes");
    return { success: true };
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e);
    if (mensaje.includes("UNIQUE")) {
      return { error: "Este anime ya lo tenés en tu catálogo" };
    }
    return { error: "Error al agregar anime" };
  }
}
