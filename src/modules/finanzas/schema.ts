import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const movimientos = sqliteTable("movimientos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tipo: text("tipo", { enum: ["ingreso", "gasto"] }).notNull(),
  monto: integer("monto").notNull(), // en centavos
  categoria: text("categoria").notNull(),
  descripcion: text("descripcion"),
  fecha: text("fecha").notNull(), // "YYYY-MM-DD"
  creadoEn: text("creado_en")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Movimiento = typeof movimientos.$inferSelect;
