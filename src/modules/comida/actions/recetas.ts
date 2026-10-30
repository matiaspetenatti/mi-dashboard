"use server";

import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { requireAuthorizedUser } from "@/lib/auth";
import { invalidarComida } from "../lib/invalidar";
import { comidaIngredientes, comidaRecetas } from "../schema";
import {
  idValido,
  primerError,
  type ResultadoAccion,
} from "./tipos";

const ingredienteSchema = z.object({
  nombre: z.string().trim().min(2, "Cada ingrediente necesita un nombre"),
  cantidad: z.number().min(0).nullable(),
  unidad: z.string().trim().min(1),
  detalle: z.string().max(200).nullable(),
  opcional: z.boolean(),
  ingredienteId: z.number().int().positive().nullable(),
});

const nutricionSchema = z.object({
  kcal: z.number().min(0).max(5000),
  proteinas: z.number().min(0).max(500),
  carbos: z.number().min(0).max(500),
  grasas: z.number().min(0).max(500),
});

const recetaEntradaSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, "El título necesita al menos 3 letras")
    .max(160, "El título es demasiado largo"),
  tipo: z.enum([
    "desayuno",
    "almuerzo",
    "cena",
    "merienda",
    "postre",
    "snack",
    "trago",
  ]),
  tono: z.enum(["rapido", "sencillo", "elaborado"]),
  minutos: z.number().int().min(1).max(600),
  porciones: z.number().int().min(1).max(24),
  ingredientes: z
    .array(ingredienteSchema)
    .min(1, "Agregá al menos un ingrediente"),
  pasos: z.array(z.string().trim().min(1, "Los pasos no pueden estar vacíos")).min(1, "Agregá al menos un paso"),
  tips: z.string().max(2000).nullable(),
  nutricion: nutricionSchema.nullable(),
  herramientas: z.array(z.string().trim()).max(20),
  vaso: z.string().max(120).nullable(),
  tecnica: z.string().max(240).nullable(),
  origen: z.enum(["ia", "manual"]),
});

export type EntradaReceta = z.infer<typeof recetaEntradaSchema>;

function validar(entrada: EntradaReceta) {
  const parsed = recetaEntradaSchema.safeParse(entrada);
  if (!parsed.success) {
    return { ok: false as const, error: primerError(parsed.error) };
  }
  return { ok: true as const, datos: parsed.data };
}

/** Guarda una receta nueva (generada por IA o cargada a mano). */
export async function guardarReceta(
  entrada: EntradaReceta,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  const resultado = validar(entrada);
  if (!resultado.ok) return { ok: false, error: resultado.error };

  try {
    const ahora = new Date().toISOString();
    const [creada] = await db
      .insert(comidaRecetas)
      .values({
        ...resultado.datos,
        creadoEn: ahora,
      })
      .returning({ id: comidaRecetas.id });

    invalidarComida();
    return { ok: true, id: creada.id };
  } catch (error) {
    console.error("[comida] Error al guardar receta:", error);
    return { ok: false, error: "No se pudo guardar la receta" };
  }
}

/** Edita una receta existente. */
export async function actualizarReceta(
  id: number,
  entrada: EntradaReceta,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  if (!idValido(id)) return { ok: false, error: "Receta inválida" };

  const resultado = validar(entrada);
  if (!resultado.ok) return { ok: false, error: resultado.error };

  try {
    await db
      .update(comidaRecetas)
      .set({
        ...resultado.datos,
        actualizadoEn: new Date().toISOString(),
      })
      .where(eq(comidaRecetas.id, id));

    invalidarComida();
    return { ok: true, id };
  } catch (error) {
    console.error("[comida] Error al actualizar receta:", error);
    return { ok: false, error: "No se pudo actualizar la receta" };
  }
}

export async function alternarFavorita(
  id: number,
  favorita: boolean,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  if (!idValido(id)) return { ok: false, error: "Receta inválida" };

  try {
    await db
      .update(comidaRecetas)
      .set({ favorita, actualizadoEn: new Date().toISOString() })
      .where(eq(comidaRecetas.id, id));

    invalidarComida();
    return { ok: true, id };
  } catch (error) {
    console.error("[comida] Error al cambiar favorita:", error);
    return { ok: false, error: "No se pudo actualizar la receta" };
  }
}

export async function eliminarReceta(id: number): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  if (!idValido(id)) return { ok: false, error: "Receta inválida" };

  try {
    await db.delete(comidaRecetas).where(eq(comidaRecetas.id, id));
    invalidarComida();
    return { ok: true };
  } catch (error) {
    console.error("[comida] Error al eliminar receta:", error);
    return { ok: false, error: "No se pudo eliminar la receta" };
  }
}

const descuentoSchema = z.array(
  z.object({
    ingredienteId: z.number().int().positive(),
    cantidad: z.number().positive().max(1_000_000),
  }),
);

/**
 * Registra que la receta se cocinó y aplica el descuento de stock que el
 * usuario confirmó en el modal. Todo en una transacción.
 */
export async function cocinarReceta(
  id: number,
  descuentos: Array<{ ingredienteId: number; cantidad: number }>,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  if (!idValido(id)) return { ok: false, error: "Receta inválida" };

  const parsed = descuentoSchema.safeParse(descuentos);
  if (!parsed.success) return { ok: false, error: primerError(parsed.error) };

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(comidaRecetas)
        .set({
          vecesCocinada: sql`${comidaRecetas.vecesCocinada} + 1`,
          ultimaVezEn: new Date().toISOString(),
          actualizadoEn: new Date().toISOString(),
        })
        .where(eq(comidaRecetas.id, id));

      for (const descuento of parsed.data) {
        await tx
          .update(comidaIngredientes)
          .set({
            cantidad: sql`max(0, ${comidaIngredientes.cantidad} - ${descuento.cantidad})`,
            actualizadoEn: new Date().toISOString(),
          })
          .where(eq(comidaIngredientes.id, descuento.ingredienteId));
      }
    });

    invalidarComida();
    return { ok: true, id };
  } catch (error) {
    console.error("[comida] Error al cocinar receta:", error);
    return { ok: false, error: "No se pudo registrar la receta cocinada" };
  }
}
