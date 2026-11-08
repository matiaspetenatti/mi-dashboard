import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const categoriasFinanzas = sqliteTable("categorias_finanzas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  tipo: text("tipo", { enum: ["ingreso", "gasto"] }).notNull(),
  icono: text("icono").notNull().default("Tag"),
  parentId: integer("parent_id").references((): any => categoriasFinanzas.id),
  orden: integer("orden").notNull().default(0),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  esSistema: integer("es_sistema", { mode: "boolean" }).notNull().default(false),
  creadoEn: text("creado_en")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const tiposCuenta = [
  "billetera",
  "banco",
  "efectivo",
  "inversion",
  "otro",
] as const;

export type TipoCuenta = (typeof tiposCuenta)[number];

export const cuentas = sqliteTable("cuentas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  tipo: text("tipo", { enum: tiposCuenta }).notNull().default("billetera"),
  color: text("color").notNull().default("#3b82f6"),
  rendimientoAnual: real("rendimiento_anual").notNull().default(0), // TNA en % (ej. 19 para 19%)
  ultimoRendimientoFecha: text("ultimo_rendimiento_fecha"), // YYYY-MM-DD
  creadoEn: text("creado_en")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const movimientos = sqliteTable("movimientos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cuentaId: integer("cuenta_id").references(() => cuentas.id),
  tipo: text("tipo", { enum: ["ingreso", "gasto"] }).notNull(),
  monto: integer("monto").notNull(), // en centavos
  categoria: text("categoria").notNull(),
  descripcion: text("descripcion"),
  fecha: text("fecha").notNull(), // "YYYY-MM-DD"
  creadoEn: text("creado_en")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Cuenta = typeof cuentas.$inferSelect;
export type NuevaCuenta = typeof cuentas.$inferInsert;
export type Movimiento = typeof movimientos.$inferSelect;
export type NuevoMovimiento = typeof movimientos.$inferInsert;
export type CategoriaFinanza = typeof categoriasFinanzas.$inferSelect;
export type NuevaCategoriaFinanza = typeof categoriasFinanzas.$inferInsert;
