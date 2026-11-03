import { sqliteTable, integer, text, real, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const animesVistos = sqliteTable("animes_vistos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kitsuId: integer("kitsu_id").notNull().unique(),
  titulo: text("titulo").notNull(),
  tituloIngles: text("titulo_ingles"),
  imagen: text("imagen").notNull(),
  tipo: text("tipo"),
  episodios: integer("episodios"),
  ano: integer("ano"),
  fechaEmision: text("fecha_emision"),
  generos: text("generos", { mode: "json" }).$type<string[]>().default([]),
  descripcion: text("descripcion"),
  scoreMal: real("score_mal"),
  miPuntaje: integer("mi_puntaje"),
  puntajePremisa: integer("puntaje_premisa"),
  puntajeRitmo: integer("puntaje_ritmo"),
  puntajeProtagonista: integer("puntaje_protagonista"),
  puntajeElenco: integer("puntaje_elenco"),
  puntajeAnimacion: integer("puntaje_animacion"),
  puntajeDireccion: integer("puntaje_direccion"),
  puntajeBandaSonora: integer("puntaje_banda_sonora"),
  puntajeOpenings: integer("puntaje_openings"),
  puntajeFinal: integer("puntaje_final"),
  puntajeRevisitabilidad: integer("puntaje_revisitabilidad"),
  episodiosVistos: integer("episodios_vistos").notNull().default(0),
  estado: text("estado", {
    enum: ["planeado", "viendo", "completado", "en_pausa", "abandonado"],
  })
    .notNull()
    .default("completado"),
  rewatch: integer("rewatch", { mode: "boolean" }).notNull().default(false),
  favorito: integer("favorito", { mode: "boolean" }).notNull().default(false),
  anilistId: integer("anilist_id"),
  estudio: text("estudio"),
  fuente: text("fuente"),
  formato: text("formato"),
  tags: text("tags", { mode: "json" }).$type<string[]>().default([]),
  notas: text("notas"),
  agregadoEn: text("agregado_en")
    .notNull()
    .default(sql`(datetime('now'))`),
  actualizadoEn: text("actualizado_en"),
}, (table) => ({
  kitsuIdIdx: index("animes_vistos_kitsu_id_idx").on(table.kitsuId),
  anilistIdIdx: index("animes_vistos_anilist_id_idx").on(table.anilistId),
  estadoIdx: index("animes_vistos_estado_idx").on(table.estado),
  favoritoIdx: index("animes_vistos_favorito_idx").on(table.favorito),
  anoIdx: index("animes_vistos_ano_idx").on(table.ano),
  estudioIdx: index("animes_vistos_estudio_idx").on(table.estudio),
  fechaEmisionIdx: index("animes_vistos_fecha_emision_idx").on(table.fechaEmision),
}));

export const ANIMES_POR_PAGINA = 15;

export type AnimeVisto = typeof animesVistos.$inferSelect;
export type NuevoAnimeVisto = typeof animesVistos.$inferInsert;

export type AnimeMetadatos = {
  tipos: string[];
  generos: string[];
  anos: number[];
  estudios: string[];
  fuentes: string[];
  formatos: string[];
  tags: string[];
  temporadas: Array<{
    key: string;
    label: string;
    año: number;
    temporada: string;
  }>;
};

export type PaginacionAnimes = {
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
};

export type AnimesPaginadosResult = PaginacionAnimes & {
  animes: AnimeVisto[];
};
