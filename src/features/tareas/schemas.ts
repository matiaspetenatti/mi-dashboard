import { z } from "zod"

export const prioridadesTarea = [
  "urgente",
  "alta",
  "media",
  "baja",
] as const

export const crearTareaRapidaSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, "Escribí un título")
    .max(200, "El título es demasiado largo"),
  fechaLimite: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
    .nullable()
    .optional(),
  prioridad: z.enum(prioridadesTarea).nullable().optional(),
})

export type CrearTareaRapidaInput = z.infer<typeof crearTareaRapidaSchema>
