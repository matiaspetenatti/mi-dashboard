import { sqliteTable, integer, real, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Ubicaciones guardadas del módulo de clima.
 * Solo una fila puede estar activa a la vez (índice único parcial).
 */
export const climaUbicacion = sqliteTable(
  "clima_ubicacion",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    etiqueta: text("etiqueta"),
    latitud: real("latitud").notNull(),
    longitud: real("longitud").notNull(),
    esActiva: integer("es_activa", { mode: "boolean" })
      .notNull()
      .default(true),
    actualizadoEn: text("actualizado_en")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (tabla) => [
    uniqueIndex("clima_ubicacion_activa_unica")
      .on(tabla.esActiva)
      .where(sql`${tabla.esActiva} = 1`),
  ],
);
