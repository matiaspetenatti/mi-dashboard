import { z } from "zod"

export const crearUbicacionSchema = z.object({
  etiqueta: z.string().trim().min(1, "Poné un nombre").max(80),
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
})

export const actualizarUbicacionSchema = z.object({
  id: z.number().int().positive(),
  etiqueta: z.string().trim().min(1, "Poné un nombre").max(80),
  latitud: z.number().min(-90).max(90),
  longitud: z.number().min(-180).max(180),
})

export const seleccionarUbicacionSchema = z.object({
  id: z.number().int().positive(),
})

export const eliminarUbicacionSchema = z.object({
  id: z.number().int().positive(),
})

export const buscarUbicacionesSchema = z.object({
  query: z.string().trim().min(2, "Escribí al menos 2 letras").max(80),
})

export type CrearUbicacionInput = z.infer<typeof crearUbicacionSchema>
export type ActualizarUbicacionInput = z.infer<
  typeof actualizarUbicacionSchema
>
export type BuscarUbicacionesInput = z.infer<typeof buscarUbicacionesSchema>
