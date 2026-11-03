import { db } from "@/db";
import { animesVistos } from "@/modules/animes/schema";
import { eq } from "drizzle-orm";

export type ProximoEstreno = {
  animeId: number;
  titulo: string;
  imagen: string;
  episodio: number | null;
  airingAt: number;
};

export async function obtenerProximoEstreno(): Promise<ProximoEstreno | null> {
  const viendo = await db
    .select()
    .from(animesVistos)
    .where(eq(animesVistos.estado, "viendo"));

  if (viendo.length === 0) return null;

  const ahora = Math.floor(Date.now() / 1000);
  const candidatos: ProximoEstreno[] = [];

  await Promise.all(
    viendo.map(async (anime) => {
      try {
        let query: string;
        if (anime.anilistId) {
          query = `query { Media(id: ${anime.anilistId}) { airingSchedule { nodes { airingAt episode } } } }`;
        } else {
          query = `query { Media(search: "${anime.titulo.replace(/"/g, '\\"')}", type: ANIME, status: RELEASING) { airingSchedule { nodes { airingAt episode } } } }`;
        }

        const res = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ query }),
          next: { revalidate: 1800 },
        });

        if (!res.ok) return;
        const json = await res.json();
        const nodes = json.data?.Media?.airingSchedule?.nodes || [];

        for (const node of nodes) {
          if (typeof node?.airingAt !== "number") continue;
          if (node.airingAt < ahora) continue;
          candidatos.push({
            animeId: anime.id,
            titulo: anime.titulo,
            imagen: anime.imagen,
            episodio: node.episode ?? null,
            airingAt: node.airingAt,
          });
        }
      } catch {
        // ignorar errores individuales
      }
    }),
  );

  if (candidatos.length === 0) return null;
  candidatos.sort((a, b) => a.airingAt - b.airingAt);
  return candidatos[0];
}