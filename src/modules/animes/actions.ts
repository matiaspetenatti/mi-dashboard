"use server";

import { requireAuthorizedUser } from "@/lib/auth";

import { db } from "@/db";
import { animesVistos } from "./schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { updateTag } from "next/cache";
import { z } from "zod";
import {
  CRITERIOS_ANIME,
  aColumnasPuntaje,
  calcularTotalPuntajes,
  validarPuntajes,
  type PuntajesCriterios,
} from "./criterios";

const ANIMES_TAG = "animes";

const invalidarCacheAnimes = () => {
  updateTag(ANIMES_TAG);
};

const parseNumero = (raw: FormDataEntryValue | null): number | null => {
  if (raw === null || raw === "") return null;
  const numero = Number(raw);
  return Number.isFinite(numero) ? numero : Number.NaN;
};

const leerPuntajes = (formData: FormData): PuntajesCriterios =>
  Object.fromEntries(
    CRITERIOS_ANIME.map((criterio) => [
      criterio.key,
      parseNumero(formData.get(criterio.campo)),
    ]),
  ) as PuntajesCriterios;

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
  const parsed = agregarSchema.safeParse({
    kitsuId: formData.get("kitsuId") || formData.get("malId"),
    titulo: formData.get("titulo"),
    tituloIngles: formData.get("tituloIngles") || null,
    imagen: formData.get("imagen"),
    tipo: formData.get("tipo") || null,
    episodios: parseNumero(formData.get("episodios")),
    ano: parseNumero(formData.get("ano")),
    fechaEmision: formData.get("fechaEmision") || null,
    generos: formData.get("generos") || "[]",
    descripcion: formData.get("descripcion") || null,
    scoreMal: parseNumero(formData.get("scoreMal")),
    estado: formData.get("estado") || "completado",
    notas: formData.get("notas") || null,
  });

  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const puntajes = leerPuntajes(formData);
  if (!validarPuntajes(puntajes)) {
    return { error: "Datos inválidos" };
  }

  const episodiosVistos = parseNumero(formData.get("episodiosVistos"));
  if (
    episodiosVistos !== null &&
    (!Number.isInteger(episodiosVistos) || episodiosVistos < 0)
  ) {
    return { error: "Datos inválidos" };
  }

  const data = parsed.data;

  try {
    let generos: string[] = [];
    try {
      generos = JSON.parse(data.generos || "[]");
    } catch {
      generos = [];
    }

    await db.insert(animesVistos).values({
      kitsuId: data.kitsuId,
      titulo: data.titulo,
      tituloIngles: data.tituloIngles,
      imagen: data.imagen,
      tipo: data.tipo,
      episodios: data.episodios,
      ano: data.ano,
      fechaEmision: data.fechaEmision,
      generos,
      descripcion: data.descripcion,
      scoreMal: data.scoreMal,
      miPuntaje: calcularTotalPuntajes(puntajes),
      ...aColumnasPuntaje(puntajes),
      episodiosVistos: clampEpisodiosVistos(
        episodiosVistos ?? 0,
        data.episodios,
      ),
      estado: data.estado,
      notas: data.notas,
      actualizadoEn: new Date().toISOString(),
    });

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

const actualizarSchema = z.object({
  id: z.coerce.number().int().positive(),
  estado: z.enum(["viendo", "completado", "en_pausa", "abandonado"]),
  notas: z.string().optional().nullable(),
  rewatch: z.coerce.boolean().optional(),
  episodiosVistos: z.number().int().min(0).optional(),
});

export async function actualizarAnimeVisto(formData: FormData) {
  await requireAuthorizedUser();
  const episodiosVistosRaw = formData.get("episodiosVistos");

  const parsed = actualizarSchema.safeParse({
    id: formData.get("id"),
    estado: formData.get("estado") || "completado",
    notas: formData.get("notas") || null,
    rewatch: formData.get("rewatch") === "true",
    episodiosVistos:
      episodiosVistosRaw === null || episodiosVistosRaw === ""
        ? undefined
        : parseNumero(episodiosVistosRaw),
  });

  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const puntajes = leerPuntajes(formData);
  if (!validarPuntajes(puntajes)) {
    return { error: "Datos inválidos" };
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

  const episodiosVistos =
    data.episodiosVistos === undefined
      ? anime.episodiosVistos
      : clampEpisodiosVistos(data.episodiosVistos, anime.episodios);

  const hayPuntajes = CRITERIOS_ANIME.some(
    (criterio) => puntajes[criterio.key] !== null,
  );

  const cambios: Partial<typeof animesVistos.$inferInsert> = {
    estado: data.estado,
    notas: data.notas,
    rewatch: data.rewatch ?? false,
    episodiosVistos,
    actualizadoEn: new Date().toISOString(),
  };

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

const progresoSchema = z.object({
  id: z.coerce.number().int().positive(),
  episodiosVistos: z.coerce.number().int().min(0),
});

export async function actualizarProgresoAnime(id: number, episodiosVistos: number) {
  await requireAuthorizedUser();
  const parsed = progresoSchema.safeParse({ id, episodiosVistos });

  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const [anime] = await db
    .select()
    .from(animesVistos)
    .where(eq(animesVistos.id, parsed.data.id))
    .limit(1);

  if (!anime) {
    return { error: "Anime no encontrado" };
  }

  const vistos = clampEpisodiosVistos(parsed.data.episodiosVistos, anime.episodios);

  await db
    .update(animesVistos)
    .set({
      episodiosVistos: vistos,
      actualizadoEn: new Date().toISOString(),
    })
    .where(eq(animesVistos.id, anime.id));

  invalidarCacheAnimes();
  revalidatePath("/animes");
  return { success: true, episodiosVistos: vistos };
}

export async function obtenerDescripcionAnime(id: number) {
  await requireAuthorizedUser();
  const [anime] = await db
    .select()
    .from(animesVistos)
    .where(eq(animesVistos.id, id))
    .limit(1);

  if (!anime) {
    return { error: "Anime no encontrado" };
  }

  if (anime.descripcion?.trim()) {
    return { descripcion: anime.descripcion };
  }

  try {
    const res = await fetch(`https://kitsu.io/api/edge/anime/${anime.kitsuId}`, {
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
    });

    if (!res.ok) {
      return { descripcion: null };
    }

    const json = await res.json();
    const descripcion: string | null = json?.data?.attributes?.synopsis || null;

    if (!descripcion?.trim()) {
      return { descripcion: null };
    }

    await db
      .update(animesVistos)
      .set({ descripcion, actualizadoEn: new Date().toISOString() })
      .where(eq(animesVistos.id, anime.id));

    invalidarCacheAnimes();
    revalidatePath("/animes");

    return { descripcion };
  } catch {
    return { descripcion: null };
  }
}

function clampEpisodiosVistos(
  vistos: number,
  total: number | null | undefined,
) {
  const normalizados = Math.max(0, Math.trunc(vistos));
  if (total !== null && total !== undefined && total > 0) {
    return Math.min(normalizados, total);
  }
  return normalizados;
}

export async function eliminarAnimeVisto(id: number) {
  await requireAuthorizedUser();
  await db.delete(animesVistos).where(eq(animesVistos.id, id));
  invalidarCacheAnimes();
  revalidatePath("/animes");
  return { success: true };
}
