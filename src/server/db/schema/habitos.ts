import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const habitos = sqliteTable("habitos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  titulo: text("titulo").notNull(),
  descripcion: text("descripcion"),
  tipo: text("tipo", {
    enum: ["bueno", "malo"],
  })
    .notNull()
    .default("bueno"),
  color: text("color").notNull().default("#163300"),
  emoji: text("emoji"),
  frecuencia: text("frecuencia").notNull().default("diaria"),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  creadoEn: text("creado_en")
    .notNull()
    .default(sql`(datetime('now'))`),
  actualizadoEn: text("actualizado_en"),
});

export const habitoRegistros = sqliteTable("habito_registros", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  habitoId: integer("habito_id")
    .notNull()
    .references(() => habitos.id, { onDelete: "cascade" }),
  fecha: text("fecha").notNull(), // "YYYY-MM-DD"
  completado: integer("completado", { mode: "boolean" }).notNull().default(false),
  notas: text("notas"),
  creadoEn: text("creado_en")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const githubActividad = sqliteTable("github_actividad", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fecha: text("fecha").notNull().unique(), // "YYYY-MM-DD"
  commits: integer("commits").notNull().default(0),
  pullRequests: integer("pull_requests").notNull().default(0),
  issues: integer("issues").notNull().default(0),
  actualizadoEn: text("actualizado_en"),
});

export const HABITOS_TIPOS = [
  { value: "bueno", label: "Hábito bueno", color: "bg-success-container text-on-success-container" },
  { value: "malo", label: "Hábito malo", color: "bg-error-container text-on-error-container" },
] as const;

export const HABITOS_COLORES = [
  { valor: "#163300", label: "Forest Ink" },
  { valor: "#054d28", label: "Spruce" },
  { valor: "#0b4c72", label: "Signal Blue" },
  { valor: "#cb272f", label: "Alarm Red" },
  { valor: "#6a6c6a", label: "Slate" },
] as const;

export type Habito = typeof habitos.$inferSelect;
export type NuevoHabito = typeof habitos.$inferInsert;
export type HabitoRegistro = typeof habitoRegistros.$inferSelect;
export type NuevoHabitoRegistro = typeof habitoRegistros.$inferInsert;
export type GithubActividad = typeof githubActividad.$inferSelect;

export type HabitoConRegistro = Habito & {
  completadoHoy: boolean;
  rachaActual: number;
  rachaMaxima: number;
  registrosUltimoAnio: Array<{ fecha: string; completado: boolean }>;
};

export const HABITOS_TAG = "habitos";
export const GITHUB_TAG = "github-actividad";
