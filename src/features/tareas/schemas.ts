import { z } from "zod"

export const prioridadesTarea = [
  "urgente",
  "alta",
  "media",
  "baja",
] as const

export const fechaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
  .nullable()
  .optional()

export const crearTareaRapidaSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, "Escribí un título")
    .max(200, "El título es demasiado largo"),
  fechaLimite: fechaSchema,
  prioridad: z.enum(prioridadesTarea).nullable().optional(),
})

export const crearTareaSchema = z.object({
  proyectoId: z.number().int().positive(),
  estadoId: z.number().int().positive(),
  titulo: z
    .string()
    .trim()
    .min(1, "Escribí un título")
    .max(200, "El título es demasiado largo"),
  descripcion: z.string().max(5000).nullable().optional(),
  prioridad: z.enum(prioridadesTarea).nullable().optional(),
  fechaInicio: fechaSchema,
  fechaLimite: fechaSchema,
  parentId: z.number().int().positive().nullable().optional(),
})

export const actualizarTareaSchema = z.object({
  id: z.number().int().positive(),
  titulo: z.string().trim().min(1).max(200).optional(),
  descripcion: z.string().max(5000).nullable().optional(),
  estadoId: z.number().int().positive().optional(),
  prioridad: z.enum(prioridadesTarea).nullable().optional(),
  fechaInicio: fechaSchema,
  fechaLimite: fechaSchema,
})

export const moverTareaSchema = z.object({
  id: z.number().int().positive(),
  estadoId: z.number().int().positive(),
  posicion: z.number().int().min(0).optional(),
})

export const alternarTareaSchema = z.object({
  id: z.number().int().positive(),
  completada: z.boolean(),
})

export const eliminarTareaSchema = z.object({
  id: z.number().int().positive(),
})

export const crearProyectoSchema = z.object({
  nombre: z.string().trim().min(1, "Poné un nombre").max(80),
  descripcion: z.string().max(500).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido")
    .default("#163300"),
  icono: z.string().max(40).default("carpeta"),
})

export const crearEtiquetaSchema = z.object({
  nombre: z.string().trim().min(1, "Poné un nombre").max(40),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido")
    .default("#737373"),
  proyectoId: z.number().int().positive().nullable().optional(),
})

export const etiquetaTareaSchema = z.object({
  tareaId: z.number().int().positive(),
  etiquetaId: z.number().int().positive(),
})

const categoriaEstadoSchema = z.enum([
  "pendiente",
  "en_progreso",
  "completado",
  "cancelado",
])

export const actualizarProyectoSchema = z.object({
  id: z.number().int().positive(),
  nombre: z.string().trim().min(1).max(80).optional(),
  descripcion: z.string().max(500).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido").optional(),
  archivado: z.boolean().optional(),
})

export const crearEstadoSchema = z.object({
  proyectoId: z.number().int().positive(),
  nombre: z.string().trim().min(1, "Poné un nombre").max(40),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido")
    .default("#737373"),
  categoria: categoriaEstadoSchema.default("pendiente"),
})

export const actualizarEstadoSchema = z.object({
  id: z.number().int().positive(),
  nombre: z.string().trim().min(1).max(40).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido").optional(),
  categoria: categoriaEstadoSchema.optional(),
})

export type CrearTareaRapidaInput = z.infer<typeof crearTareaRapidaSchema>
export type CrearTareaInput = z.infer<typeof crearTareaSchema>
export type ActualizarTareaInput = z.infer<typeof actualizarTareaSchema>
export type MoverTareaInput = z.infer<typeof moverTareaSchema>
export type AlternarTareaInput = z.infer<typeof alternarTareaSchema>
export type CrearProyectoInput = z.infer<typeof crearProyectoSchema>
export type CrearEtiquetaInput = z.infer<typeof crearEtiquetaSchema>
export type EtiquetaTareaInput = z.infer<typeof etiquetaTareaSchema>
export type ActualizarProyectoInput = z.infer<typeof actualizarProyectoSchema>
export type CrearEstadoInput = z.infer<typeof crearEstadoSchema>
export type ActualizarEstadoInput = z.infer<typeof actualizarEstadoSchema>
