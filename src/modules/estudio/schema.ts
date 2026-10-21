import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const materias = sqliteTable("materias", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  creadaEn: text("creada_en")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const examenes = sqliteTable("examenes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  materiaId: integer("materia_id")
    .notNull()
    .references(() => materias.id),
  tipo: text("tipo", {
    enum: ["parcial", "final", "recuperatorio", "tp"],
  }).notNull(),
  fecha: text("fecha").notNull(), // "YYYY-MM-DD"
  nota: real("nota"), // null hasta que se rinde
  creadoEn: text("creado_en")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Materia = typeof materias.$inferSelect;
