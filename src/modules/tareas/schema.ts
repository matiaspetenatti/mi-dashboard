import {
  sqliteTable,
  integer,
  text,
  primaryKey,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { unidadesRecurrencia } from "./constantes";

export const grupos = sqliteTable("grupos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  color: text("color").notNull().default("#737373"),
});

export const tareas = sqliteTable("tareas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  titulo: text("titulo").notNull(),
  completada: integer("completada", { mode: "boolean" })
    .notNull()
    .default(false),
  enCurso: integer("en_curso", { mode: "boolean" }).notNull().default(false),
  fechaLimite: text("fecha_limite"), // "YYYY-MM-DD", opcional
  parentId: integer("parent_id").references((): AnySQLiteColumn => tareas.id),
  grupoId: integer("grupo_id").references(() => grupos.id),
  recurrencia: text("recurrencia", { enum: unidadesRecurrencia }), // unidad; null = no se repite
  recurrenciaCada: integer("recurrencia_cada").notNull().default(1), // cada N unidades
  creadaEn: text("creada_en")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull().unique(),
  color: text("color").notNull().default("#737373"),
  icono: text("icono"), // clave de iconos.ts, opcional
});

export const tareasTags = sqliteTable(
  "tareas_tags",
  {
    tareaId: integer("tarea_id")
      .notNull()
      .references(() => tareas.id),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id),
  },
  (t) => [primaryKey({ columns: [t.tareaId, t.tagId] })],
);

export type Tarea = typeof tareas.$inferSelect;
