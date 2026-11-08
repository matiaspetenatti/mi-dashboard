import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Episodios de migraña.
 * Las fechas y horas se guardan en formato local `YYYY-MM-DDTHH:mm`
 * (America/Argentina/Cordoba) para que no se corran por UTC.
 */
export const saludEpisodios = sqliteTable(
  "salud_episodios",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    inicioEn: text("inicio_en").notNull(),
    finEn: text("fin_en"),
    intensidad: integer("intensidad").notNull(),
    patron: text("patron", {
      enum: ["pulsatil", "opresivo", "punzante"],
    }),
    lateralidad: text("lateralidad", {
      enum: ["izquierdo", "derecho", "bilateral"],
    }),
    aura: integer("aura", { mode: "boolean" }).notNull().default(false),
    auraTipos: text("aura_tipos", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    sintomas: text("sintomas", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    tomoTetralgin: integer("tomo_tetralgin", { mode: "boolean" })
      .notNull()
      .default(false),
    dosisTetralgin: integer("dosis_tetralgin"),
    tetralginEn: text("tetralgin_en"),
    alivio: text("alivio", {
      enum: ["completo", "parcial", "ninguno"],
    }),
    otroDesencadenante: text("otro_desencadenante"),
    notas: text("notas"),
    creadoEn: text("creado_en")
      .notNull()
      .default(sql`(datetime('now'))`),
    actualizadoEn: text("actualizado_en"),
  },
  (tabla) => [index("salud_episodios_inicio_idx").on(tabla.inicioEn)],
);

/**
 * Desencadenantes elegidos por episodio.
 * El catálogo de etiquetas vive en `constantes.ts`; acá solo guardamos el slug.
 */
export const saludEpisodioDesencadenantes = sqliteTable(
  "salud_episodio_desencadenantes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    episodioId: integer("episodio_id")
      .notNull()
      .references(() => saludEpisodios.id, { onDelete: "cascade" }),
    factor: text("factor").notNull(),
  },
  (tabla) => [
    uniqueIndex("salud_episodio_factor_unico").on(
      tabla.episodioId,
      tabla.factor,
    ),
    index("salud_episodio_factor_episodio_idx").on(tabla.episodioId),
  ],
);

/**
 * Diario de bienestar: un registro por día.
 * Sirve para comparar hábitos en días con y sin crisis.
 */
export const saludRegistrosDiarios = sqliteTable(
  "salud_registros_diarios",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fecha: text("fecha").notNull(),
    horasSueno: real("horas_sueno"),
    calidadSueno: integer("calidad_sueno"),
    vasosAgua: integer("vasos_agua"),
    nivelEstres: integer("nivel_estres"),
    horasPantalla: real("horas_pantalla"),
    tazasCafeina: integer("tazas_cafeina"),
    comidasOmitidas: integer("comidas_omitidas"),
    actividadMin: integer("actividad_min"),
    animo: integer("animo"),
    pesoKg: real("peso_kg"),
    notas: text("notas"),
    creadoEn: text("creado_en")
      .notNull()
      .default(sql`(datetime('now'))`),
    actualizadoEn: text("actualizado_en"),
  },
  (tabla) => [uniqueIndex("salud_registros_fecha_unica").on(tabla.fecha)],
);

export type EpisodioSalud = typeof saludEpisodios.$inferSelect;
export type NuevoEpisodioSalud = typeof saludEpisodios.$inferInsert;
export type DesencadenanteEpisodio =
  typeof saludEpisodioDesencadenantes.$inferSelect;
export type RegistroDiarioSalud = typeof saludRegistrosDiarios.$inferSelect;

export type PatronDolor = NonNullable<EpisodioSalud["patron"]>;
export type LateralidadDolor = NonNullable<EpisodioSalud["lateralidad"]>;
export type AlivioTetralgin = NonNullable<EpisodioSalud["alivio"]>;
