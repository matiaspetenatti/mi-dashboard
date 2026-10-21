import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const tareas = sqliteTable("tareas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  titulo: text("titulo").notNull(),
  completada: integer("completada", { mode: "boolean" })
    .notNull()
    .default(false),
  fechaLimite: text("fecha_limite"), // "YYYY-MM-DD", opcional
  creadaEn: text("creada_en")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Tarea = typeof tareas.$inferSelect;
