import { z } from "zod"

import {
  cuatrimestres,
  estadosCarrera,
  estadosExamen,
  estadosMateria,
  resultadosExamen,
  tiposExamen,
  tiposSesion,
} from "@/server/db/schema"

const fechaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")

const notaSchema = z.number().min(0).max(10).nullable().optional()
const anioSchema = z.number().int().min(1).max(20).nullable().optional()
const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido")

export const idSchema = z.object({
  id: z.number().int().positive(),
})

export const crearCarreraSchema = z.object({
  nombre: z.string().trim().min(1, "Poné un nombre").max(100),
  institucion: z.string().max(120).nullable().optional(),
  estado: z.enum(estadosCarrera).default("cursando"),
  anioInicio: z.number().int().min(1900).max(2200).nullable().optional(),
  anioFin: z.number().int().min(1900).max(2200).nullable().optional(),
  materiasTotales: z.number().int().min(1).max(500).nullable().optional(),
  color: colorSchema.default("#8b4a2b"),
  notas: z.string().max(2000).nullable().optional(),
})

export const actualizarCarreraSchema = crearCarreraSchema.partial().extend({
  id: z.number().int().positive(),
})

export const crearMateriaSchema = z.object({
  carreraId: z.number().int().positive(),
  nombre: z.string().trim().min(1, "Poné un nombre").max(100),
  anio: anioSchema,
  cuatrimestre: z.enum(cuatrimestres).nullable().optional(),
  creditos: z.number().int().min(0).max(1000).nullable().optional(),
  correlativas: z.array(z.number().int().positive()).default([]),
  estado: z.enum(estadosMateria).default("pendiente"),
  notaFinal: notaSchema,
  profesor: z.string().max(120).nullable().optional(),
  notas: z.string().max(2000).nullable().optional(),
})

export const actualizarMateriaSchema = crearMateriaSchema.partial().extend({
  id: z.number().int().positive(),
})

export const crearExamenSchema = z.object({
  materiaId: z.number().int().positive(),
  tipo: z.enum(tiposExamen),
  titulo: z.string().max(120).nullable().optional(),
  fecha: fechaSchema,
  nota: notaSchema,
  resultado: z.enum(resultadosExamen).nullable().optional(),
  estado: z.enum(estadosExamen).default("programado"),
  observaciones: z.string().max(1000).nullable().optional(),
})

export const actualizarExamenSchema = crearExamenSchema.partial().extend({
  id: z.number().int().positive(),
})

export const registrarSesionSchema = z.object({
  carreraId: z.number().int().positive(),
  materiaId: z.number().int().positive(),
  tipo: z.enum(tiposSesion).default("trabajo"),
  duracionMinutos: z.number().int().min(1).max(480),
  fecha: fechaSchema,
})

export type CrearCarreraInput = z.infer<typeof crearCarreraSchema>
export type ActualizarCarreraInput = z.infer<typeof actualizarCarreraSchema>
export type CrearMateriaInput = z.infer<typeof crearMateriaSchema>
export type ActualizarMateriaInput = z.infer<typeof actualizarMateriaSchema>
export type CrearExamenInput = z.infer<typeof crearExamenSchema>
export type ActualizarExamenInput = z.infer<typeof actualizarExamenSchema>
export type RegistrarSesionInput = z.infer<typeof registrarSesionSchema>
