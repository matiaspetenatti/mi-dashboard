import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const estadosCarrera = [
  "cursando",
  "pausada",
  "graduada",
  "abandonada",
] as const;

export const estadosMateria = [
  "pendiente",
  "cursando",
  "regular",
  "aprobada",
  "libre",
] as const;

export const cuatrimestres = ["1", "2", "anual"] as const;

export const tiposExamen = [
  "parcial",
  "final",
  "recuperatorio",
  "tp",
  "coloquio",
  "otro",
] as const;

export const estadosExamen = ["programado", "rendido", "ausente"] as const;

export const resultadosExamen = ["aprobado", "desaprobado"] as const;

export const tiposSesion = ["trabajo", "descanso_corto", "descanso_largo"] as const;

export type EstadoCarrera = (typeof estadosCarrera)[number];
export type EstadoMateria = (typeof estadosMateria)[number];
export type Cuatrimestre = (typeof cuatrimestres)[number];
export type TipoExamen = (typeof tiposExamen)[number];
export type EstadoExamen = (typeof estadosExamen)[number];
export type ResultadoExamen = (typeof resultadosExamen)[number];
export type TipoSesion = (typeof tiposSesion)[number];

export const carreras = sqliteTable("carreras", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  institucion: text("institucion"),
  estado: text("estado", { enum: estadosCarrera })
    .notNull()
    .default("cursando"),
  anioInicio: integer("anio_inicio"),
  anioFin: integer("anio_fin"),
  materiasTotales: integer("materias_totales"),
  color: text("color").notNull().default("#8b4a2b"),
  notas: text("notas"),
  creadaEn: text("creada_en")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const materias = sqliteTable(
  "materias",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    carreraId: integer("carrera_id")
      .notNull()
      .references(() => carreras.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    anio: integer("anio"),
    cuatrimestre: text("cuatrimestre", { enum: cuatrimestres }),
    creditos: integer("creditos"),
    estado: text("estado", { enum: estadosMateria })
      .notNull()
      .default("pendiente"),
    notaFinal: real("nota_final"),
    profesor: text("profesor"),
    notas: text("notas"),
    creadaEn: text("creada_en")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (tabla) => [
    uniqueIndex("materias_carrera_nombre_unico").on(
      tabla.carreraId,
      tabla.nombre,
    ),
    index("materias_carrera_idx").on(tabla.carreraId),
  ],
);

export const examenes = sqliteTable(
  "examenes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    materiaId: integer("materia_id")
      .notNull()
      .references(() => materias.id, { onDelete: "cascade" }),
    tipo: text("tipo", { enum: tiposExamen }).notNull(),
    titulo: text("titulo"),
    fecha: text("fecha").notNull(), // "YYYY-MM-DD"
    nota: real("nota"), // null hasta que se rinde
    resultado: text("resultado", { enum: resultadosExamen }), // solo si no hay nota
    estado: text("estado", { enum: estadosExamen })
      .notNull()
      .default("programado"),
    observaciones: text("observaciones"),
    creadoEn: text("creado_en")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (tabla) => [
    index("examenes_materia_idx").on(tabla.materiaId),
    index("examenes_fecha_idx").on(tabla.fecha),
  ],
);

export type Carrera = typeof carreras.$inferSelect;
export type NuevaCarrera = typeof carreras.$inferInsert;
export type Materia = typeof materias.$inferSelect;
export type NuevaMateria = typeof materias.$inferInsert;
export type Examen = typeof examenes.$inferSelect;
export type NuevoExamen = typeof examenes.$inferInsert;

export const sesionesEstudio = sqliteTable(
  "sesiones_estudio",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    carreraId: integer("carrera_id")
      .notNull()
      .references(() => carreras.id, { onDelete: "cascade" }),
    materiaId: integer("materia_id")
      .notNull()
      .references(() => materias.id, { onDelete: "cascade" }),
    tipo: text("tipo", { enum: tiposSesion }).notNull(),
    duracionMinutos: integer("duracion_minutos").notNull(),
    fecha: text("fecha").notNull(), // "YYYY-MM-DD"
    creadaEn: text("creada_en")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (tabla) => [
    index("sesiones_estudio_carrera_idx").on(tabla.carreraId),
    index("sesiones_estudio_materia_idx").on(tabla.materiaId),
    index("sesiones_estudio_fecha_idx").on(tabla.fecha),
  ],
);

export type SesionEstudio = typeof sesionesEstudio.$inferSelect;
export type NuevaSesionEstudio = typeof sesionesEstudio.$inferInsert;
