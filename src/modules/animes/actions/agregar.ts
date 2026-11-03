"use server";

import { requireAuthorizedUser } from "@/lib/auth";

import { db } from "@/db";
import { animesVistos } from "@/modules/animes/schema";
import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { z } from "zod";
import {
  aColumnasPuntaje,
  calcularTotalPuntajes,
} from "@/modules/animes/lib/criterios";
import { leerPuntajesFormData } from "./_puntajes";
import { invalidarCacheAnimes } from "@/modules/animes/lib/cache";

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
  estado: z.enum(["planeado", "viendo", "completado", "en_pausa", "abandonado"]),
  notas: z.string().nullable(),
  episodiosVistos: z.number().int().min(0),
  favorito: z.boolean(),
  anilistId: z.number().int().nullable(),
  estudio: z.string().nullable(),
  fuente: z.string().nullable(),
  formato: z.string().nullable(),
  tags: z.array(z.string()),
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
  const favorito = formData.get("favorito") === "true";
  const anilistId = parseNumero(formData.get("anilistId"));
  const estudio =
    formData.get("estudio") === null || formData.get("estudio") === ""
      ? null
      : String(formData.get("estudio"));
  const fuente =
    formData.get("fuente") === null || formData.get("fuente") === ""
      ? null
      : String(formData.get("fuente"));
  const formato =
    formData.get("formato") === null || formData.get("formato") === ""
      ? null
      : String(formData.get("formato"));
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("tags") ?? "[]"));
    tags = Array.isArray(parsed)
      ? Array.from(
          new Set(
            parsed
              .map((t: unknown) => String(t).trim().toLowerCase())
              .filter(Boolean),
          ),
        )
      : [];
  } catch {
    tags = [];
  }

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
    favorito,
    anilistId,
    estudio,
    fuente,
    formato,
    tags,
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

  // Detección de duplicados por título (además de kitsu_id).
  const existente = await db
    .select({ id: animesVistos.id })
    .from(animesVistos)
    .where(
      sql`LOWER(${animesVistos.titulo}) = LOWER(${data.titulo}) OR (${animesVistos.tituloIngles} IS NOT NULL AND LOWER(${animesVistos.tituloIngles}) = LOWER(${data.tituloIngles ?? ""}))`,
    )
    .limit(1);

  if (existente.length > 0) {
    return {
      error:
        "Ya tenés un anime con ese título en tu catálogo. Abrí su tarjeta y usá Editar.",
    };
  }

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
