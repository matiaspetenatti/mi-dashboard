import { NextRequest, NextResponse } from "next/server";
import { rejectUnauthorizedRequest } from "@/lib/auth";

function normalizarAnime(
  item: Record<string, unknown>,
  categoriesById: Map<string, string>,
  studio: string | null = null,
) {
  const attrs = (item.attributes ?? {}) as Record<string, unknown>;
  const titles = (attrs.titles ?? {}) as Record<string, unknown>;
  const poster = (attrs.posterImage ?? {}) as Record<string, unknown>;
  const startDate = (attrs.startDate as string | null) ?? null;
  const year = startDate ? Number(String(startDate).slice(0, 4)) : null;

  const relationships = (item.relationships ?? {}) as Record<string, unknown>;
  const categoriesRel = (relationships.categories ?? {}) as Record<string, unknown>;
  const relCats = (categoriesRel.data ?? []) as Array<Record<string, unknown>>;

  const genres: string[] = [];
  for (const c of relCats) {
    const name = categoriesById.get(String(c.id));
    if (name && !genres.includes(name)) genres.push(name);
  }

  return {
    kitsu_id: Number(item.id ?? 0),
    title: (attrs.canonicalTitle as string) || (titles.en_jp as string) || (titles.en as string) || "",
    title_english: (titles.en as string) || null,
    images: {
      webp: { large_image_url: (poster.large as string) || (poster.medium as string) || (poster.original as string) || "" },
      jpg: { large_image_url: (poster.large as string) || (poster.medium as string) || (poster.original as string) || "" },
    },
    type: attrs.subtype ? String(attrs.subtype).toUpperCase() : null,
    episodes: (attrs.episodeCount as number | null) ?? null,
    year,
    aired: { from: startDate },
    genres: genres.map((g) => ({ name: g })),
    score: attrs.averageRating
      ? Number((Number(attrs.averageRating) / 10).toFixed(2))
      : null,
    synopsis: (attrs.synopsis as string) || null,
    studio,
  };
}

function leerCategorias(included: Array<Record<string, unknown>>) {
  const categoriesById = new Map<string, string>();
  for (const inc of included) {
    const rec = inc as Record<string, unknown>;
    const attrs = (rec.attributes ?? {}) as Record<string, unknown>;
    if (rec.type === "categories" && typeof attrs.title === "string") {
      categoriesById.set(String(rec.id), attrs.title);
    }
  }
  return categoriesById;
}

async function obtenerStudioKitsu(id: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://kitsu.io/api/edge/anime/${encodeURIComponent(id)}/media-productions?include=producer`,
      {
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const included = json.included || [];
    const producersById = new Map<string, string>();
    for (const inc of included) {
      const rec = inc as Record<string, unknown>;
      const attrs = (rec.attributes ?? {}) as Record<string, unknown>;
      if (rec.type === "producers" && typeof attrs.name === "string") {
        producersById.set(String(rec.id), attrs.name);
      }
    }
    const data = json.data || [];
    for (const item of data) {
      const rec = item as Record<string, unknown>;
      const attrs = (rec.attributes ?? {}) as Record<string, unknown>;
      if (attrs.role !== "studio") continue;
      const rels = (rec.relationships ?? {}) as Record<string, unknown>;
      const producerRel = (rels.producer ?? {}) as Record<string, unknown>;
      const producerData = (producerRel.data ?? {}) as Record<string, unknown>;
      const name = producersById.get(String(producerData.id));
      if (name) return name;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const denied = await rejectUnauthorizedRequest();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const id = searchParams.get("id") || "";
  const limit = searchParams.get("limit") || "12";

  if (!q.trim() && !id.trim()) {
    return NextResponse.json({ data: [] });
  }

  try {
    const url = id.trim()
      ? `https://kitsu.io/api/edge/anime/${encodeURIComponent(id.trim())}?include=categories`
      : `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(
          q.trim()
        )}&page[limit]=${limit}&include=categories`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Error al buscar en Kitsu", data: [] }, { status: res.status });
    }

    const json = await res.json();
    const categoriesById = leerCategorias(json.included || []);

    if (id.trim()) {
      if (!json.data) {
        return NextResponse.json({ error: "Anime no encontrado en Kitsu", data: null }, { status: 404 });
      }
      const studio = await obtenerStudioKitsu(id.trim());
      return NextResponse.json({ data: normalizarAnime(json.data, categoriesById, studio) });
    }

    const normalized = (json.data || []).map((item: Record<string, unknown>) =>
      normalizarAnime(item, categoriesById, null),
    );

    return NextResponse.json({ data: normalized });
  } catch {
    return NextResponse.json({ error: "No se pudo conectar con Kitsu", data: [] }, { status: 503 });
  }
}
