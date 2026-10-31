"use server";

import { requireAuthorizedUser } from "@/lib/auth";

import { db } from "@/db";
import { animesVistos } from "@/modules/animes/schema";
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

const agregarSchema = z.object({
  kitsuId: z.coerce.number().int().positive(),
  titulo: z.string().min(1),
  tituloIngles: z.string().nullable(),
  imagen: z.string().min(1),
  tipo: z.string().nullable(),
  episodios: z.number().int().min(0).nullable(),
  ano: z.number().int().nullable(),
  fechaEmision: z.string().nullable(),
  generos: z.array(z.string()),
  descripcion: z.string().nullable(),
  scoreMal: z.number().nullable(),
  estado: z.enum(["viendo", "completado", "en_pausa", "abandonado"]),
  notas: z.string().nullable(),
  episodiosVistos: z.number().int().min(0),
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
  const episodiosVistosRaw = parseNumero(formData.get("episodiosVistos")) ?? 0;

  let generos: string[] = [];
  try {
    const parsed = JSON.parse(generosRaw || "[]");
    generos = Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    generos = [];
  }

  const puntajes = leerPuntajesFormData(formData);
  if (!puntajes) return { error: "Puntajes inválidos" };

  const parsed = agregarSchema.safeParse({
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
    estado,
    notas,
    episodiosVistos: episodiosVistosRaw,
  });

  if (!parsed.success) return { error: "Datos inválidos" };

  const { episodios: totalEpisodios, episodiosVistos, ...resto } = parsed.data;
  const vistos =
    totalEpisodios && totalEpisodios > 0
      ? Math.max(0, Math.min(episodiosVistos, totalEpisodios))
      : Math.max(0, episodiosVistos);

  // id es autoincrement: no se incluye en el insert para que SQLite lo asigne.
  // Nunca pasamos id: null porque SQLite lo rechaza en columnas autoincrement.
  const data: Omit<typeof animesVistos.$inferInsert, "id"> = {
    ...resto,
    episodios: totalEpisodios,
    ...aColumnasPuntaje(puntajes),
    miPuntaje: calcularTotalPuntajes(puntajes),
    episodiosVistos: vistos,
    actualizadoEn: new Date().toISOString(),
  };

  try {
    await db.insert(animesVistos).values(data);
    invalidarCacheAnimes();
    revalidatePath("/animes");
    return { success: true };
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e);
    const lower = mensaje.toLowerCase();
    console.error("[agregarAnime] Error:", e);

    // Detectar restricción UNIQUE en kitsu_id (anime ya existe en la galería).
    // SQLite/Drizzle pueden devolver el mensaje en varios formatos, así que
    // buscamos varias palabras clave para ser robustos.
    const esDuplicado =
      lower.includes("unique") ||
      lower.includes("constraint") ||
      lower.includes("kitsu_id") ||
      lower.includes("duplicat");

    if (esDuplicado) {
      return {
        error:
          "Este anime ya está en tu catálogo. Abrí su tarjeta y usá Editar si querés modificarlo.",
      };
    }

    if (lower.includes("not null")) {
      return { error: "Faltan datos obligatorios para agregar el anime" };
    }

    return { error: `Error al agregar anime: ${mensaje}` };
  }
}
