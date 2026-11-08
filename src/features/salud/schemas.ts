import { z } from "zod"

import { MAX_COMPRIMIDOS_TETRALGIN } from "./constantes"
import {
  REGEX_FECHA,
  REGEX_FECHA_HORA,
  compararFechaHora,
} from "./lib/fechas"

const fechaHoraSchema = z
  .string()
  .regex(REGEX_FECHA_HORA, "Fecha y hora inválidas")

const fechaSchema = z.string().regex(REGEX_FECHA, "Fecha inválida")

const episodioShape = {
  inicioEn: fechaHoraSchema,
  finEn: fechaHoraSchema.nullable(),
  intensidad: z
    .number()
    .int()
    .min(1, "La intensidad va de 1 a 10")
    .max(10, "La intensidad va de 1 a 10"),
  patron: z.enum(["pulsatil", "opresivo", "punzante"]).nullable(),
  lateralidad: z.enum(["izquierdo", "derecho", "bilateral"]).nullable(),
  aura: z.boolean(),
  auraTipos: z.array(z.string()).default([]),
  sintomas: z.array(z.string()).default([]),
  tomoTetralgin: z.boolean(),
  dosisTetralgin: z
    .number()
    .int()
    .min(1, "La dosis mínima es 1 comprimido")
    .max(
      MAX_COMPRIMIDOS_TETRALGIN,
      `La dosis máxima es ${MAX_COMPRIMIDOS_TETRALGIN} comprimidos`,
    )
    .nullable(),
  tetralginEn: fechaHoraSchema.nullable(),
  alivio: z.enum(["completo", "parcial", "ninguno"]).nullable(),
  otroDesencadenante: z.string().max(200).nullable(),
  notas: z.string().max(2000, "Las notas son demasiado largas").nullable(),
  factores: z.array(z.string()).default([]),
}

type EpisodioBase = z.infer<z.ZodObject<typeof episodioShape>>

function refinarEpisodio(datos: EpisodioBase, ctx: z.RefinementCtx) {
  if (datos.finEn && compararFechaHora(datos.finEn, datos.inicioEn) <= 0) {
    ctx.addIssue({
      code: "custom",
      path: ["finEn"],
      message: "La hora de cierre tiene que ser posterior al inicio",
    })
  }

  if (datos.tomoTetralgin && datos.dosisTetralgin === null) {
    ctx.addIssue({
      code: "custom",
      path: ["dosisTetralgin"],
      message: "Indicá cuántos comprimidos de Tetralgin tomaste",
    })
  }

  if (datos.tomoTetralgin && datos.finEn && datos.alivio === null) {
    ctx.addIssue({
      code: "custom",
      path: ["alivio"],
      message: "Indicá cómo respondió el Tetralgin",
    })
  }

  if (
    datos.factores.includes("otro") &&
    !datos.otroDesencadenante?.trim()
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["otroDesencadenante"],
      message: "Contanos cuál fue el desencadenante",
    })
  }
}

export const crearEpisodioSchema = z
  .object(episodioShape)
  .superRefine(refinarEpisodio)

export const actualizarEpisodioSchema = z
  .object({ id: z.number().int().positive(), ...episodioShape })
  .superRefine(refinarEpisodio)

export const cerrarEpisodioSchema = z.object({
  id: z.number().int().positive(),
  finEn: fechaHoraSchema,
})

export const guardarRegistroDiarioSchema = z.object({
  fecha: fechaSchema,
  horasSueno: z.number().min(0).max(24, "Máximo 24 horas").nullable(),
  calidadSueno: z.number().int().min(1).max(5).nullable(),
  vasosAgua: z.number().int().min(0).max(30).nullable(),
  nivelEstres: z.number().int().min(1).max(5).nullable(),
  horasPantalla: z.number().min(0).max(24, "Máximo 24 horas").nullable(),
  tazasCafeina: z.number().int().min(0).max(20).nullable(),
  comidasOmitidas: z.number().int().min(0).max(10).nullable(),
  actividadMin: z.number().int().min(0).max(1440).nullable(),
  animo: z.number().int().min(1).max(5).nullable(),
  pesoKg: z.number().min(20).max(400).nullable(),
  notas: z.string().max(1000, "Las notas son demasiado largas").nullable(),
})

export const idSaludSchema = z.object({
  id: z.number().int().positive(),
})

export type CrearEpisodioInput = z.infer<typeof crearEpisodioSchema>
export type ActualizarEpisodioInput = z.infer<typeof actualizarEpisodioSchema>
export type CerrarEpisodioInput = z.infer<typeof cerrarEpisodioSchema>
export type GuardarRegistroDiarioInput = z.infer<
  typeof guardarRegistroDiarioSchema
>
