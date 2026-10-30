import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export type TipoItemComida = "ingrediente" | "utensilio";
export type UbicacionComida = "heladera" | "freezer" | "despensa" | "bar";
export type TipoReceta =
  | "desayuno"
  | "almuerzo"
  | "cena"
  | "merienda"
  | "postre"
  | "snack"
  | "trago";
export type TonoReceta = "rapido" | "sencillo" | "elaborado";
export type OrigenReceta = "ia" | "manual";
export type OrigenLista = "manual" | "stock" | "receta" | "menu";
export type MomentoMenu = "desayuno" | "almuerzo" | "merienda" | "cena";

/** Ingrediente de una receta tal como lo devuelve la IA o lo carga el usuario. */
export type IngredienteReceta = {
  nombre: string;
  cantidad: number | null;
  unidad: string;
  detalle: string | null;
  opcional: boolean;
  /** Id del inventario cuando el ingrediente sale de la despensa. */
  ingredienteId: number | null;
};

/** Estimación nutricional por porción. Siempre se muestra como aproximada. */
export type NutricionReceta = {
  kcal: number;
  proteinas: number;
  carbos: number;
  grasas: number;
};

/**
 * Inventario de despensa, heladera, freezer y barra.
 * Los utensilios de coctelería viven acá con `tipo = "utensilio"`: no tienen
 * stock ni vencimiento, pero la IA los recibe como herramientas disponibles.
 */
export const comidaIngredientes = sqliteTable(
  "comida_ingredientes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    nombre: text("nombre").notNull(),
    nombreNormalizado: text("nombre_normalizado").notNull(),
    tipo: text("tipo", { enum: ["ingrediente", "utensilio"] })
      .notNull()
      .default("ingrediente"),
    categoria: text("categoria").notNull().default("otros"),
    cantidad: real("cantidad").notNull().default(0),
    unidad: text("unidad").notNull().default("unidad"),
    ubicacion: text("ubicacion", {
      enum: ["heladera", "freezer", "despensa", "bar"],
    })
      .notNull()
      .default("despensa"),
    caducaEn: text("caduca_en"),
    stockMinimo: real("stock_minimo"),
    notas: text("notas"),
    creadoEn: text("creado_en")
      .notNull()
      .default(sql`(datetime('now'))`),
    actualizadoEn: text("actualizado_en"),
  },
  (tabla) => [
    uniqueIndex("comida_ingredientes_nombre_unico").on(tabla.nombreNormalizado),
    index("comida_ingredientes_categoria_idx").on(tabla.categoria),
  ],
);

/**
 * Recetario. Guarda tanto recetas generadas por IA como cargadas a mano.
 * El detalle (ingredientes, pasos, nutrición, herramientas) va en JSON para
 * mantener una sola forma entre ambos orígenes.
 */
export const comidaRecetas = sqliteTable(
  "comida_recetas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    titulo: text("titulo").notNull(),
    tipo: text("tipo", {
      enum: [
        "desayuno",
        "almuerzo",
        "cena",
        "merienda",
        "postre",
        "snack",
        "trago",
      ],
    })
      .notNull()
      .default("cena"),
    tono: text("tono", { enum: ["rapido", "sencillo", "elaborado"] })
      .notNull()
      .default("sencillo"),
    minutos: integer("minutos").notNull().default(30),
    porciones: integer("porciones").notNull().default(2),
    ingredientes: text("ingredientes", { mode: "json" })
      .$type<IngredienteReceta[]>()
      .notNull()
      .default([]),
    pasos: text("pasos", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    tips: text("tips"),
    nutricion: text("nutricion", { mode: "json" }).$type<NutricionReceta | null>(),
    /** Herramientas de bar utilizadas (solo tragos). */
    herramientas: text("herramientas", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    vaso: text("vaso"),
    tecnica: text("tecnica"),
    origen: text("origen", { enum: ["ia", "manual"] })
      .notNull()
      .default("manual"),
    favorita: integer("favorita", { mode: "boolean" }).notNull().default(false),
    vecesCocinada: integer("veces_cocinada").notNull().default(0),
    ultimaVezEn: text("ultima_vez_en"),
    creadoEn: text("creado_en")
      .notNull()
      .default(sql`(datetime('now'))`),
    actualizadoEn: text("actualizado_en"),
  },
  (tabla) => [
    index("comida_recetas_tipo_idx").on(tabla.tipo),
    index("comida_recetas_favorita_idx").on(tabla.favorita),
  ],
);

/**
 * Planificación semanal: un renglón por día y momento.
 * `dia` es la fecha local `YYYY-MM-DD`; la semana se arma por rango.
 */
export const comidaMenu = sqliteTable(
  "comida_menu",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    dia: text("dia").notNull(),
    momento: text("momento", {
      enum: ["desayuno", "almuerzo", "merienda", "cena"],
    }).notNull(),
    recetaId: integer("receta_id").references(() => comidaRecetas.id, {
      onDelete: "set null",
    }),
    titulo: text("titulo"),
    ingredientes: text("ingredientes", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    minutos: integer("minutos"),
    reutiliza: text("reutiliza"),
    hecho: integer("hecho", { mode: "boolean" }).notNull().default(false),
    creadoEn: text("creado_en")
      .notNull()
      .default(sql`(datetime('now'))`),
    actualizadoEn: text("actualizado_en"),
  },
  (tabla) => [
    uniqueIndex("comida_menu_dia_momento_unico").on(tabla.dia, tabla.momento),
    index("comida_menu_dia_idx").on(tabla.dia),
  ],
);

/** Lista de compras: manual, sugerida por stock bajo o faltantes de recetas. */
export const comidaLista = sqliteTable(
  "comida_lista",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    nombre: text("nombre").notNull(),
    nombreNormalizado: text("nombre_normalizado").notNull(),
    cantidad: real("cantidad").notNull().default(1),
    unidad: text("unidad").notNull().default("unidad"),
    categoria: text("categoria").notNull().default("otros"),
    precioCentavos: integer("precio_centavos"),
    comprado: integer("comprado", { mode: "boolean" }).notNull().default(false),
    origen: text("origen", { enum: ["manual", "stock", "receta", "menu"] })
      .notNull()
      .default("manual"),
    recetaId: integer("receta_id").references(() => comidaRecetas.id, {
      onDelete: "set null",
    }),
    creadoEn: text("creado_en")
      .notNull()
      .default(sql`(datetime('now'))`),
    compradoEn: text("comprado_en"),
  },
  (tabla) => [
    index("comida_lista_comprado_idx").on(tabla.comprado),
    index("comida_lista_categoria_idx").on(tabla.categoria),
  ],
);

export type ItemComida = typeof comidaIngredientes.$inferSelect;
export type RecetaComida = typeof comidaRecetas.$inferSelect;
export type SlotMenuComida = typeof comidaMenu.$inferSelect;
export type ItemListaComida = typeof comidaLista.$inferSelect;
