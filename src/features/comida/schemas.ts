import { z } from "zod"

import { REGEX_FECHA } from "./lib/semana"

const categorias = [
  "carnes",
  "verduras",
  "frutas",
  "lacteos",
  "almacen",
  "bebidas",
  "congelados",
  "preparadas",
  "bar",
  "otros",
] as const

const unidades = [
  "unidad",
  "g",
  "kg",
  "ml",
  "l",
  "atado",
  "lata",
  "paquete",
  "taza",
  "cucharada",
  "cucharadita",
  "diente",
  "rodaja",
  "pizca",
] as const

const tiposReceta = [
  "desayuno",
  "almuerzo",
  "cena",
  "merienda",
  "postre",
  "snack",
  "trago",
] as const

const tonos = ["rapido", "sencillo", "elaborado"] as const
const momentos = ["desayuno", "almuerzo", "merienda", "cena"] as const

export const itemComidaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Poné un nombre de al menos 2 letras")
    .max(120, "El nombre es demasiado largo"),
  tipo: z.enum(["ingrediente", "utensilio"]),
  categoria: z.enum(categorias),
  cantidad: z.number().min(0).max(1_000_000),
  unidad: z.enum(unidades),
  ubicacion: z.enum(["heladera", "freezer", "despensa", "bar"]),
  caducaEn: z.string().regex(REGEX_FECHA, "Fecha inválida").nullable(),
  stockMinimo: z.number().min(0).nullable(),
  notas: z.string().max(500, "Las notas son demasiado largas").nullable(),
})

export const actualizarItemComidaSchema = itemComidaSchema.extend({
  id: z.number().int().positive(),
})

export const ajustarCantidadSchema = z.object({
  id: z.number().int().positive(),
  cantidad: z.number().min(0).max(1_000_000),
})

export const idComidaSchema = z.object({
  id: z.number().int().positive(),
})

const ingredienteRecetaSchema = z.object({
  nombre: z.string().trim().min(2, "Cada ingrediente necesita un nombre"),
  cantidad: z.number().min(0).nullable(),
  unidad: z.enum(unidades),
  detalle: z.string().max(200).nullable(),
  opcional: z.boolean(),
  ingredienteId: z.number().int().positive().nullable(),
})

const nutricionSchema = z.object({
  kcal: z.number().min(0).max(5000),
  proteinas: z.number().min(0).max(500),
  carbos: z.number().min(0).max(500),
  grasas: z.number().min(0).max(500),
  fibra: z.number().min(0).max(100),
  azucares: z.number().min(0).max(100),
  sodio: z.number().min(0).max(5000),
})

const recetaShape = {
  titulo: z
    .string()
    .trim()
    .min(3, "El título necesita al menos 3 letras")
    .max(160, "El título es demasiado largo"),
  tipo: z.enum(tiposReceta),
  tono: z.enum(tonos),
  minutos: z.number().int().min(1).max(600),
  porciones: z.number().int().min(1).max(24),
  ingredientes: z
    .array(ingredienteRecetaSchema)
    .min(1, "Agregá al menos un ingrediente"),
  pasos: z
    .array(z.string().trim().min(1, "Los pasos no pueden estar vacíos"))
    .min(1, "Agregá al menos un paso"),
  tips: z.string().max(2000).nullable(),
  nutricion: nutricionSchema.nullable(),
  herramientas: z.array(z.string().trim()).max(20),
  vaso: z.string().max(120).nullable(),
  tecnica: z.string().max(240).nullable(),
}

export const crearRecetaSchema = z.object({
  ...recetaShape,
  origen: z.enum(["ia", "manual"]).default("manual"),
  puntaje: z.number().int().min(0).max(5).default(0),
})

export const actualizarRecetaSchema = z.object({
  id: z.number().int().positive(),
  ...recetaShape,
})

export const cocinarRecetaSchema = z.object({
  id: z.number().int().positive(),
  descontarStock: z.boolean(),
})

export const favoritaRecetaSchema = z.object({
  id: z.number().int().positive(),
  favorita: z.boolean(),
})

export const slotMenuSchema = z
  .object({
    id: z.number().int().positive().optional(),
    dia: z.string().regex(REGEX_FECHA, "Fecha inválida"),
    momento: z.enum(momentos),
    recetaId: z.number().int().positive().nullable(),
    titulo: z.string().trim().max(160).nullable(),
    minutos: z.number().int().min(1).max(600).nullable(),
    ingredientes: z.array(z.string().trim().min(1)).max(40),
    nutricion: nutricionSchema.nullable().optional(),
    reutiliza: z.string().max(200).nullable(),
  })
  .refine(
    (datos) => Boolean(datos.recetaId) || (datos.titulo?.trim().length ?? 0) >= 2,
    {
      message: "Elegí una receta o escribí un título",
      path: ["titulo"],
    },
  )

export const alternarSlotSchema = z.object({
  id: z.number().int().positive(),
  hecho: z.boolean(),
})

export const idSlotMenuSchema = z.object({
  id: z.number().int().positive(),
})

export const limpiarSemanaSchema = z.object({
  semana: z.string().regex(REGEX_FECHA, "Semana inválida"),
})

export const itemListaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Poné un nombre de al menos 2 letras")
    .max(120),
  cantidad: z.number().min(0.01, "La cantidad tiene que ser mayor a cero"),
  unidad: z.enum(unidades),
  categoria: z.enum(categorias),
  precioCentavos: z.number().int().min(0).nullable(),
})

export const actualizarItemListaSchema = itemListaSchema.extend({
  id: z.number().int().positive(),
})

export const alternarCompradoSchema = z.object({
  id: z.number().int().positive(),
  comprado: z.boolean(),
})

export const faltantesRecetaSchema = z.object({
  recetaId: z.number().int().positive(),
})

export const faltantesMenuSchema = z.object({
  semana: z.string().regex(REGEX_FECHA, "Semana inválida"),
})

export const workspaceComidaSchema = z.object({
  semana: z.string().regex(REGEX_FECHA).optional(),
})

export type ItemComidaInput = z.infer<typeof itemComidaSchema>
export type ActualizarItemComidaInput = z.infer<
  typeof actualizarItemComidaSchema
>
export type CrearRecetaInput = z.infer<typeof crearRecetaSchema>
export type ActualizarRecetaInput = z.infer<typeof actualizarRecetaSchema>
export type SlotMenuInput = z.infer<typeof slotMenuSchema>
export type ItemListaInput = z.infer<typeof itemListaSchema>
export type ActualizarItemListaInput = z.infer<
  typeof actualizarItemListaSchema
>
