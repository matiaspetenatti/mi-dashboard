import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { animesVistos } from "@/modules/animes/schema";
import { eq } from "drizzle-orm";
import { rejectUnauthorizedRequest } from "@/lib/auth";

const TIMEZONE_ARG = "America/Argentina/Buenos_Aires";

function obtenerRangoSemana() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_ARG,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  const parts = formatter.formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dayStr = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dayStr}`;
  };
  
  return { inicio: formatDate(monday), fin: formatDate(sunday) };
}

function formatearHoraEnArgentina(timestamp: number) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("es-AR", {
    timeZone: TIMEZONE_ARG,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function obtenerDiaSemanaEnArgentina(timestamp: number): number {
  const date = new Date(timestamp * 1000);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_ARG,
    weekday: "short",
  });
  const day = formatter.format(date);
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return map[day] ?? 0;
}

function obtenerInicioFinSemanaTimestamp() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE_ARG,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  const parts = formatter.formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return {
    inicio: Math.floor(monday.getTime() / 1000),
    fin: Math.floor(sunday.getTime() / 1000),
  };
}

export async function GET(req: NextRequest) {
  const denied = await rejectUnauthorizedRequest();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const forzarActualizacion = searchParams.get("force") === "true";
    
    const animesViendo = await db
      .select()
      .from(animesVistos)
      .where(eq(animesVistos.estado, "viendo"));
  
    if (animesViendo.length === 0) {
      return NextResponse.json({
        semana: obtenerRangoSemana(),
        dias: [],
        sinHorarios: [],
        actualizadoEn: new Date().toISOString(),
      });
    }
    
    const { inicio, fin } = obtenerInicioFinSemanaTimestamp();
    
    // Buscar en AniList por títulos
    const diasMap = new Map<number, any[]>();
    const animesConHorarios = new Set<number>();
    
    await Promise.all(
      animesViendo.map(async (anime) => {
        try {
          const query = `
            query {
              Media(search: "${anime.titulo.replace(/"/g, '\\"')}", type: ANIME, status: RELEASING) {
                id
                title { romaji english }
                airingSchedule {
                  nodes {
                    airingAt
                    episode
                  }
                }
              }
            }
          `;
          
          const res = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify({ query }),
            cache: forzarActualizacion ? "no-store" : "force-cache",
            next: forzarActualizacion ? { revalidate: 0 } : { revalidate: 3600 },
          });
          
          if (!res.ok) return;
          
          const json = await res.json();
          const media = json.data?.Media;
          if (!media) return;
          
          const schedules = media.airingSchedule?.nodes || [];
          const ahoraUnix = Math.floor(Date.now() / 1000);
          
          for (const schedule of schedules) {
            if (schedule.airingAt < inicio || schedule.airingAt > fin) continue;
            
            animesConHorarios.add(anime.kitsuId);
            const diaSemana = obtenerDiaSemanaEnArgentina(schedule.airingAt);
            const hora = formatearHoraEnArgentina(schedule.airingAt);
            
            const entrada = {
              id: `${anime.kitsuId}-${schedule.airingAt}`,
              animeId: anime.kitsuId,
              animeVistoId: anime.id,
              titulo: anime.titulo,
              imagen: anime.imagen,
              episodio: schedule.episode,
              hora,
              fecha: "",
              airingAt: new Date(schedule.airingAt * 1000).toISOString(),
              estado: anime.estado,
              emitido: schedule.airingAt < ahoraUnix,
            };
            
            if (!diasMap.has(diaSemana)) {
              diasMap.set(diaSemana, []);
            }
            diasMap.get(diaSemana)!.push(entrada);
          }
        } catch (err) {
          console.error(`Error fetching from AniList for ${anime.titulo}:`, err);
        }
      })
    );
    
    // Ordenar por hora
    for (const [dia, items] of diasMap.entries()) {
      items.sort((a, b) => {
        if (a.hora < b.hora) return -1;
        if (a.hora > b.hora) return 1;
        return 0;
      });
      diasMap.set(dia, items);
    }
    
    const sinHorarios = animesViendo
      .filter((a) => !animesConHorarios.has(a.kitsuId))
      .map((a) => ({
        animeId: a.kitsuId,
        animeVistoId: a.id,
        titulo: a.titulo,
        imagen: a.imagen,
        estado: a.estado,
      }));
  
    const diasNombres = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const dias = [];
    
    for (let i = 0; i < 7; i++) {
      dias.push({
        indice: i,
        nombre: diasNombres[i],
        items: diasMap.get(i) || [],
      });
    }
    
    return NextResponse.json({
      semana: obtenerRangoSemana(),
      dias,
      sinHorarios,
      actualizadoEn: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Error en calendario:", e);
    return NextResponse.json(
      { error: "Error interno", dias: [], sinHorarios: [] },
      { status: 500 }
    );
  }
}
