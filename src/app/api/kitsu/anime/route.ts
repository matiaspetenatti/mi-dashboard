import { NextRequest, NextResponse } from "next/server";
import { rejectUnauthorizedRequest } from "@/lib/auth";

function normalizarAnime(item: any, categoriesById: Map<string, string>) {
  const attrs = item.attributes || {};
  const titles = attrs.titles || {};
  const poster = attrs.posterImage || {};
  const startDate = attrs.startDate || null;
  const year = startDate ? Number(String(startDate).slice(0, 4)) : null;

  const genres: string[] = [];
  const relCats = item.relationships?.categories?.data || [];
  for (const c of relCats) {
    const name = categoriesById.get(c.id);
    if (name && !genres.includes(name)) genres.push(name);
  }

  return {
    kitsu_id: Number(item.id),
    title: attrs.canonicalTitle || titles.en_jp || titles.en || "",
    title_english: titles.en || null,
    images: {
      webp: { large_image_url: poster.large || poster.medium || poster.original || "" },
      jpg: { large_image_url: poster.large || poster.medium || poster.original || "" },
    },
    type: attrs.subtype ? attrs.subtype.toUpperCase() : null,
    episodes: attrs.episodeCount ?? null,
    year,
    aired: { from: startDate },
    genres: genres.map((g) => ({ name: g })),
    score: attrs.averageRating ? Number((Number(attrs.averageRating) / 10).toFixed(2)) : null,
    synopsis: attrs.synopsis || null,
  };
}

function leerCategorias(included: any[]) {
  const categoriesById = new Map<string, string>();
  for (const inc of included) {
    if (inc.type === "categories" && inc.attributes?.title) {
      categoriesById.set(inc.id, inc.attributes.title);
    }
  }
  return categoriesById;
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
      return NextResponse.json({ data: normalizarAnime(json.data, categoriesById) });
    }

    const normalized = (json.data || []).map((item: any) => normalizarAnime(item, categoriesById));

    return NextResponse.json({ data: normalized });
  } catch (e) {
    return NextResponse.json({ error: "No se pudo conectar con Kitsu", data: [] }, { status: 503 });
  }
}
