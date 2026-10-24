import { db } from "@/db";
import { animesVistos } from "@/modules/animes/schema";
import { sql } from "drizzle-orm";
import { obtenerTemporadaAnime } from "../lib/utils";

export type AnimeMetadatos = {
  tipos: string[];
  generos: string[];
  anos: number[];
  temporadas: Array<{
    key: string;
    label: string;
    año: number;
    temporada: string;
  }>;
};

export async function obtenerMetadatosAnime(): Promise<AnimeMetadatos> {
  const [tiposRows,anosRows,fechasRows,generosRows] = await Promise.all([
    db.selectDistinct({ tipo: animesVistos.tipo }).from(animesVistos),
    db.selectDistinct({ ano: animesVistos.ano }).from(animesVistos),
    db
      .selectDistinct({ fechaEmision: animesVistos.fechaEmision })
      .from(animesVistos),
    db.all<{ genero: string }>(
      sql`select distinct json_each.value as genero
          from ${animesVistos}, json_each(${animesVistos.generos})
          where json_each.value is not null and json_each.value <> ''`,
    ),
  ]);

  const tipos = tiposRows
    .flatMap((r) => (r.tipo ? [r.tipo] : []))
    .sort();

  const anos = anosRows
    .flatMap((r) => (r.ano ? [r.ano] : []))
    .sort((a, b) => b - a);

  const generos = generosRows.map((r) => r.genero).sort();

  const temporadas = new Map<
    string,
    { key: string; label: string; año: number; temporada: string }
  >();

  for (const r of fechasRows) {
    const temp = obtenerTemporadaAnime(r.fechaEmision);
    if (temp && !temporadas.has(temp.key)) {
      temporadas.set(temp.key, {
        key: temp.key,
        label: temp.label,
        año: temp.año,
        temporada: temp.temporada,
      });
    }
  }

  const temporadasList = Array.from(temporadas.values()).sort((a, b) => {
    if (a.año !== b.año) return b.año - a.año;

    const ordenTemporadas: Record<string, number> = {
      otoño: 0,
      invierno: 1,
      primavera: 2,
      verano: 3,
    };

    return (
      (ordenTemporadas[b.temporada] ?? 0) -
      (ordenTemporadas[a.temporada] ?? 0)
    );
  });

  return {
    tipos,
    generos,
  anos,
    temporadas: temporadasList,
  };
}