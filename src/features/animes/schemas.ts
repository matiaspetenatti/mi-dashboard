import { z } from "zod"

import { estadosAnime } from "./constantes"

const fechaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")

const puntajeCriterioSchema = z
  .number()
  .int()
  .min(0)
  .max(10)
  .nullable()
  .optional()

export const puntajesAnimeSchema = z.object({
  premisa: puntajeCriterioSchema,
  ritmo: puntajeCriterioSchema,
  protagonista: puntajeCriterioSchema,
  elenco: puntajeCriterioSchema,
  animacion: puntajeCriterioSchema,
  direccion: puntajeCriterioSchema,
  bandaSonora: puntajeCriterioSchema,
  openings: puntajeCriterioSchema,
  final: puntajeCriterioSchema,
  revisitabilidad: puntajeCriterioSchema,
})

export const crearAnimeSchema = z.object({
  kitsuId: z.number().int().positive(),
  titulo: z.string().trim().min(1, "Poné un título").max(300),
  tituloIngles: z.string().trim().max(300).nullable().optional(),
  imagen: z.string().trim().min(1, "Falta la imagen").max(2000),
  tipo: z.string().trim().max(60).nullable().optional(),
  episodios: z.number().int().min(0).max(10000).nullable().optional(),
  ano: z.number().int().min(1900).max(2200).nullable().optional(),
  fechaEmision: fechaSchema.nullable().optional(),
  generos: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
  descripcion: z.string().max(10000).nullable().optional(),
  scoreMal: z.number().min(0).max(10).nullable().optional(),
  estado: z.enum(estadosAnime).default("completado"),
  notas: z.string().max(5000).nullable().optional(),
  episodiosVistos: z.number().int().min(0).default(0),
  favorito: z.boolean().default(false),
  anilistId: z.number().int().positive().nullable().optional(),
  estudio: z.string().trim().max(120).nullable().optional(),
  fuente: z.string().trim().max(80).nullable().optional(),
  formato: z.string().trim().max(80).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(40).default([]),
  puntajes: puntajesAnimeSchema.optional(),
})

export const actualizarAnimeSchema = crearAnimeSchema
  .partial()
  .extend({ id: z.number().int().positive() })

export const actualizarProgresoSchema = z.object({
  id: z.number().int().positive(),
  episodiosVistos: z.number().int().min(0).max(10000),
})

export const idAnimeSchema = z.object({
  id: z.number().int().positive(),
})

export const buscarKitsuSchema = z.object({
  q: z.string().trim().min(2, "Escribí al menos 2 caracteres").max(120),
})

export const detalleKitsuSchema = z.object({
  id: z.number().int().positive(),
})

export const calendarioAnimesSchema = z.object({
  forzar: z.boolean().optional(),
})

export type CrearAnimeInput = z.infer<typeof crearAnimeSchema>
export type ActualizarAnimeInput = z.infer<typeof actualizarAnimeSchema>
export type ActualizarProgresoInput = z.infer<typeof actualizarProgresoSchema>
export type PuntajesAnimeInput = z.infer<typeof puntajesAnimeSchema>
