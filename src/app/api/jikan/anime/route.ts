import { NextRequest, NextResponse } from "next/server";
import { rejectUnauthorizedRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const denied = await rejectUnauthorizedRequest();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const limit = searchParams.get("limit") || "12";

  if (!q.trim()) {
    return NextResponse.json({ data: [] });
  }

  try {
    const res = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(q.trim())}&limit=${limit}&sfw=true`,
      {
        headers: {
          "User-Agent": "mi-dashboard",
          Accept: "application/json",
        },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Error al buscar en Jikan", data: [] }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "No se pudo conectar con Jikan", data: [] }, { status: 503 });
  }
}
