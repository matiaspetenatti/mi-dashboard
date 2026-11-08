import { z } from "zod"

const fechaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")

const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido")

export const crearHabitoSchema = z.object({
  titulo: z.string().trim().min(1, "El título es obligatorio").max(120),
  descripcion: z.string().trim().max(500).nullable().optional(),
  tipo: z.enum(["bueno", "malo"]),
  color: colorSchema.default("#163300"),
  emoji: z.string().trim().max(10).nullable().optional(),
  frecuencia: z.enum(["diaria"]).default("diaria"),
  activo: z.boolean().default(true),
})

export const actualizarHabitoSchema = crearHabitoSchema
  .partial()
  .extend({ id: z.number().int().positive() })

export const alternarActivoHabitoSchema = z.object({
  id: z.number().int().positive(),
  activo: z.boolean(),
})

export const registrarHabitoSchema = z.object({
  habitoId: z.number().int().positive(),
  fecha: fechaSchema,
  completado: z.boolean(),
  notas: z.string().trim().max(500).nullable().optional(),
})

export const idHabitoSchema = z.object({
  id: z.number().int().positive(),
})

export type CrearHabitoInput = z.infer<typeof crearHabitoSchema>
export type ActualizarHabitoInput = z.infer<typeof actualizarHabitoSchema>
export type RegistrarHabitoInput = z.infer<typeof registrarHabitoSchema>
