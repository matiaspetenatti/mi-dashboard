import { z } from "zod";
import {
  categoriasEstado,
  prioridades,
  tiposVista,
  unidadesRecurrencia,
} from "@/modules/tareas/constantes";

export const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const idSchema = z.number().int().positive();

export const fechaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
  .refine((valor) => {
    const fecha = new Date(`${valor}T00:00:00Z`);
    return !Number.isNaN(fecha.getTime()) &&
      fecha.toISOString().slice(0, 10) === valor;
  }, "Fecha inválida");

export const tituloSchema = z.string().trim().min(1, "Escribí un título").max(300);
export const descripcionSchema = z.string().max(20_000);
export const nombreSchema = z.string().trim().min(1).max(80);
export const iconoSchema = z.string().trim().max(40);

export const proyectoCrearSchema = z.object({
  nombre: nombreSchema,
  descripcion: descripcionSchema.nullable().optional(),
  color: colorSchema,
  icono: iconoSchema,
  prefijo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,6}$/)
    .optional(),
});

export const proyectoActualizarSchema = proyectoCrearSchema.partial().extend({
  nombre: nombreSchema.optional(),
});

export const estadoSchema = z.object({
  nombre: nombreSchema,
  color: colorSchema,
  categoria: z.enum(categoriasEstado),
});

export const tareaCrearSchema = z.object({
  proyectoId: z.number().int().positive(),
  estadoId: z.number().int().positive(),
  parentId: z.number().int().positive().nullable().optional(),
  titulo: tituloSchema,
  descripcion: descripcionSchema.nullable().optional(),
  prioridad: z.enum(prioridades).nullable().optional(),
  fechaInicio: fechaSchema.nullable().optional(),
  fechaLimite: fechaSchema.nullable().optional(),
  recurrencia: z.enum(unidadesRecurrencia).nullable().optional(),
  recurrenciaCada: z.number().int().min(1).max(365).optional(),
  etiquetaIds: z.array(z.number().int().positive()).max(20).optional(),
});

export const tareaActualizarSchema = z.object({
  titulo: tituloSchema.optional(),
  descripcion: descripcionSchema.nullable().optional(),
  estadoId: z.number().int().positive().optional(),
  prioridad: z.enum(prioridades).nullable().optional(),
  fechaInicio: fechaSchema.nullable().optional(),
  fechaLimite: fechaSchema.nullable().optional(),
  recurrencia: z.enum(unidadesRecurrencia).nullable().optional(),
  recurrenciaCada: z.number().int().min(1).max(365).optional(),
  etiquetaIds: z.array(z.number().int().positive()).max(20).optional(),
});

export const etiquetaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .toLowerCase()
    .transform((valor) => valor.replace(/^#/, ""))
    .pipe(z.string().min(1).max(30)),
  color: colorSchema.optional(),
  icono: iconoSchema.nullable().optional(),
});

export const vistaCrearSchema = z.object({
  proyectoId: z.number().int().positive(),
  nombre: nombreSchema,
  tipo: z.enum(tiposVista),
  config: z.unknown().optional(),
});

export const vistaActualizarSchema = z.object({
  nombre: nombreSchema.optional(),
  tipo: z.enum(tiposVista).optional(),
  config: z.unknown().optional(),
});
