import { z } from "zod";
import {
  cuatrimestres,
  estadosCarrera,
  estadosExamen,
  estadosMateria,
  resultadosExamen,
  tiposExamen,
  tiposSesion,
} from "../schema";

function textoOpcional(max: number) {
  return z.preprocess(
    (valor) =>
      typeof valor === "string" ? valor.trim() || null : (valor ?? null),
    z.string().max(max, `Máximo ${max} caracteres`).nullable(),
  );
}

function enteroOpcional(min: number, max: number) {
  return z.preprocess(
    (valor) =>
      valor === "" || valor === null || valor === undefined
        ? null
        : Number(valor),
    z
      .number()
      .int("Tiene que ser un número entero")
      .min(min)
      .max(max)
      .nullable(),
  );
}

const notaOpcional = z.preprocess(
  (valor) => {
    if (valor === "" || valor === null || valor === undefined) return null;
    const numero = Number(String(valor).replace(",", "."));
    return Number.isNaN(numero) ? valor : numero;
  },
  z.number().min(0, "La nota mínima es 0").max(10, "La nota máxima es 10").nullable(),
);

const colorHex = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido");

export const carreraSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  institucion: textoOpcional(120),
  estado: z.enum(estadosCarrera).default("cursando"),
  anioInicio: enteroOpcional(1900, 2200),
  anioFin: enteroOpcional(1900, 2200),
  materiasTotales: enteroOpcional(1, 500),
  color: colorHex.default("#8b4a2b"),
  notas: textoOpcional(2000),
});

export const materiaSchema = z.object({
  carreraId: z.coerce.number().int().positive(),
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  anio: enteroOpcional(1, 20),
  cuatrimestre: z.enum(cuatrimestres).nullable().default(null),
  creditos: enteroOpcional(0, 1000),
  estado: z.enum(estadosMateria).default("pendiente"),
  notaFinal: notaOpcional,
  profesor: textoOpcional(120),
  notas: textoOpcional(2000),
});

export const examenSchema = z.object({
  materiaId: z.coerce.number().int().positive(),
  tipo: z.enum(tiposExamen),
  titulo: textoOpcional(120),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha no es válida"),
  nota: notaOpcional,
  resultado: z.enum(resultadosExamen).nullable().default(null),
  estado: z.enum(estadosExamen).default("programado"),
  observaciones: textoOpcional(1000),
});

export const estadoExamenSchema = z.enum(estadosExamen);

export const resultadoExamenSchema = z.enum(resultadosExamen);

export const sesionEstudioSchema = z.object({
  carreraId: z.coerce.number().int().positive(),
  materiaId: z.coerce.number().int().positive(),
  tipo: z.enum(tiposSesion),
  duracionMinutos: z.number().int().positive().max(480),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
});

export const notaExamenSchema = z.preprocess(
  (valor) => {
    const numero = Number(String(valor ?? "").replace(",", "."));
    return Number.isNaN(numero) ? valor : numero;
  },
  z.number().min(0, "La nota mínima es 0").max(10, "La nota máxima es 10"),
);
