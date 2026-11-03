import {
  sqliteTable,
  integer,
  text,
  primaryKey,
  index,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import {
  categoriasEstado,
  prioridades,
  unidadesRecurrencia,
  type CategoriaEstado,
  type Prioridad,
  type UnidadRecurrencia,
} from "./constantes";
import type { ConfigVista } from "./lib/config-vista";

export const proyectos = sqliteTable("proyectos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  slug: text("slug").notNull().unique(),
  descripcion: text("descripcion"),
  icono: text("icono").notNull().default("carpeta"),
  color: text("color").notNull().default("#6750a4"),
  prefijo: text("prefijo").notNull().default("TAR"),
  posicion: integer("posicion").notNull().default(0),
  archivado: integer("archivado", { mode: "boolean" }).notNull().default(false),
  creadoEn: text("creado_en")
    .notNull()
    .default(sql`(datetime('now'))`),
  actualizadoEn: text("actualizado_en"),
});

export const estadosProyecto = sqliteTable(
  "estados_proyecto",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    proyectoId: integer("proyecto_id")
      .notNull()
      .references(() => proyectos.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    color: text("color").notNull().default("#737373"),
    categoria: text("categoria", { enum: categoriasEstado })
      .notNull()
      .default("pendiente"),
    posicion: integer("posicion").notNull().default(0),
  },
  (t) => [index("estados_proyecto_proyecto_idx").on(t.proyectoId)],
);

export const tareas = sqliteTable(
  "tareas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    proyectoId: integer("proyecto_id")
      .notNull()
      .references(() => proyectos.id, { onDelete: "cascade" }),
    estadoId: integer("estado_id")
      .notNull()
      .references(() => estadosProyecto.id),
    parentId: integer("parent_id").references(
      (): AnySQLiteColumn => tareas.id,
    ),
    titulo: text("titulo").notNull(),
    descripcion: text("descripcion"),
    prioridad: text("prioridad", { enum: prioridades }),
    fechaInicio: text("fecha_inicio"),
    fechaLimite: text("fecha_limite"),
    completadaEn: text("completada_en"),
    posicion: integer("posicion").notNull().default(0),
    destacada: integer("destacada", { mode: "boolean" })
      .notNull()
      .default(false),
    archivadaEn: text("archivada_en"),
    estimacionMinutos: integer("estimacion_minutos"),
    tiempoRegistradoSegundos: integer("tiempo_registrado_segundos")
      .notNull()
      .default(0),
    color: text("color"),
    recurrencia: text("recurrencia", { enum: unidadesRecurrencia }),
    recurrenciaCada: integer("recurrencia_cada").notNull().default(1),
    recurrenciaDiasSemana: text("recurrencia_dias_semana"),
    recurrenciaFin: text("recurrencia_fin"),
    recurrenciaSaltada: text("recurrencia_saltada"),
    asignadoA: text("asignado_a"),
    creadaEn: text("creada_en")
      .notNull()
      .default(sql`(datetime('now'))`),
    actualizadaEn: text("actualizada_en"),
  },
  (t) => [
    index("tareas_proyecto_idx").on(t.proyectoId),
    index("tareas_estado_idx").on(t.estadoId),
    index("tareas_parent_idx").on(t.parentId),
    index("tareas_fecha_idx").on(t.fechaLimite),
  ],
);

export const etiquetas = sqliteTable(
  "etiquetas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    nombre: text("nombre").notNull(),
    color: text("color").notNull().default("#737373"),
    icono: text("icono"),
    proyectoId: integer("proyecto_id").references(() => proyectos.id, {
      onDelete: "cascade",
    }),
  },
  (t) => [index("etiquetas_proyecto_idx").on(t.proyectoId)],
);

export const tareasEtiquetas = sqliteTable(
  "tareas_etiquetas",
  {
    tareaId: integer("tarea_id")
      .notNull()
      .references(() => tareas.id, { onDelete: "cascade" }),
    etiquetaId: integer("etiqueta_id")
      .notNull()
      .references(() => etiquetas.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.tareaId, t.etiquetaId] })],
);

export const vistasProyecto = sqliteTable(
  "vistas_proyecto",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    proyectoId: integer("proyecto_id")
      .notNull()
      .references(() => proyectos.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    tipo: text("tipo", {
      enum: ["lista", "tablero", "tabla", "calendario", "cronograma"],
    }).notNull(),
    config: text("config", { mode: "json" })
      .$type<ConfigVista>()
      .notNull(),
    posicion: integer("posicion").notNull().default(0),
    predeterminada: integer("predeterminada", { mode: "boolean" })
      .notNull()
      .default(false),
    creadaEn: text("creada_en")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [index("vistas_proyecto_proyecto_idx").on(t.proyectoId)],
);

export const tareaComentarios = sqliteTable(
  "tarea_comentarios",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tareaId: integer("tarea_id")
      .notNull()
      .references(() => tareas.id, { onDelete: "cascade" }),
    autorId: text("autor_id").notNull(),
    texto: text("texto").notNull(),
    creadoEn: text("creado_en")
      .notNull()
      .default(sql`(datetime('now'))`),
    editadoEn: text("editado_en"),
  },
  (t) => [index("tarea_comentarios_tarea_idx").on(t.tareaId)],
);

export const tareaAdjuntos = sqliteTable(
  "tarea_adjuntos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tareaId: integer("tarea_id")
      .notNull()
      .references(() => tareas.id, { onDelete: "cascade" }),
    tipo: text("tipo", { enum: ["enlace", "archivo"] })
      .notNull()
      .default("enlace"),
    nombre: text("nombre").notNull(),
    url: text("url").notNull(),
    tamano: integer("tamano"),
    creadoEn: text("creado_en")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [index("tarea_adjuntos_tarea_idx").on(t.tareaId)],
);

export const tareaDependencias = sqliteTable(
  "tarea_dependencias",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tareaId: integer("tarea_id")
      .notNull()
      .references(() => tareas.id, { onDelete: "cascade" }),
    dependeDeId: integer("depende_de_id")
      .notNull()
      .references(() => tareas.id, { onDelete: "cascade" }),
    tipo: text("tipo", { enum: ["bloquea", "relacionada"] })
      .notNull()
      .default("bloquea"),
    creadoEn: text("creado_en")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    index("tarea_dependencias_tarea_idx").on(t.tareaId),
    index("tarea_dependencias_depe_idx").on(t.dependeDeId),
  ],
);

export const vistasGuardadas = sqliteTable(
  "vistas_guardadas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    usuarioId: text("usuario_id").notNull(),
    nombre: text("nombre").notNull(),
    alcance: text("alcance", { enum: ["global", "proyecto"] })
      .notNull()
      .default("global"),
    proyectoId: integer("proyecto_id").references(() => proyectos.id, {
      onDelete: "cascade",
    }),
    config: text("config", { mode: "json" })
      .$type<ConfigVista>()
      .notNull(),
    creadoEn: text("creado_en")
      .notNull()
      .default(sql`(datetime('now'))`),
    actualizadoEn: text("actualizado_en"),
  },
  (t) => [index("vistas_guardadas_usuario_idx").on(t.usuarioId)],
);

export type Proyecto = typeof proyectos.$inferSelect;
export type NuevoProyecto = typeof proyectos.$inferInsert;
export type EstadoProyecto = typeof estadosProyecto.$inferSelect;
export type Tarea = typeof tareas.$inferSelect;
export type NuevaTarea = typeof tareas.$inferInsert;
export type Etiqueta = typeof etiquetas.$inferSelect;
export type VistaProyecto = typeof vistasProyecto.$inferSelect;
export type TareaComentario = typeof tareaComentarios.$inferSelect;
export type TareaAdjunto = typeof tareaAdjuntos.$inferSelect;
export type TareaDependencia = typeof tareaDependencias.$inferSelect;
export type VistaGuardada = typeof vistasGuardadas.$inferSelect;

export type { CategoriaEstado, Prioridad, UnidadRecurrencia, ConfigVista };
