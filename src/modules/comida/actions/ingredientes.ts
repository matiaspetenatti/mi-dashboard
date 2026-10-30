"use server";

import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { requireAuthorizedUser } from "@/lib/auth";
import { normalizarNombre } from "../lib/cantidades";
import { invalidarComida } from "../lib/invalidar";
import { REGEX_FECHA } from "../lib/semana";
import { comidaIngredientes } from "../schema";
import {
  idValido,
  numero,
  opcional,
  primerError,
  texto,
  type ResultadoAccion,
} from "./tipos";

const itemSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Poné un nombre de al menos 2 letras")
    .max(120, "El nombre es demasiado largo"),
  tipo: z.enum(["ingrediente", "utensilio"]),
  categoria: z.string().trim().min(1, "Elegí una categoría"),
  cantidad: z
    .number()
    .min(0, "La cantidad no puede ser negativa")
    .max(1_000_000, "La cantidad es demasiado grande"),
  unidad: z.string().trim().min(1, "Elegí una unidad"),
  ubicacion: z.enum(["heladera", "freezer", "despensa", "bar"]),
  caducaEn: z
    .string()
    .regex(REGEX_FECHA, "Fecha de vencimiento inválida")
    .nullable(),
  stockMinimo: z
    .number()
    .min(0, "El stock mínimo no puede ser negativo")
    .nullable(),
  notas: z.string().max(500, "Las notas son demasiado largas").nullable(),
});

function leerDatos(formData: FormData) {
  const tipo = texto(formData, "tipo") === "utensilio" ? "utensilio" : "ingrediente";

  return {
    nombre: texto(formData, "nombre"),
    tipo,
    categoria: texto(formData, "categoria") || (tipo === "utensilio" ? "bar" : "otros"),
    cantidad: tipo === "utensilio" ? 0 : (numero(formData, "cantidad") ?? 0),
    unidad: tipo === "utensilio" ? "unidad" : texto(formData, "unidad") || "unidad",
    ubicacion:
      tipo === "utensilio"
        ? "bar"
        : (texto(formData, "ubicacion") || "despensa"),
    caducaEn: tipo === "utensilio" ? null : opcional(formData, "caducaEn"),
    stockMinimo:
      tipo === "utensilio" ? null : numero(formData, "stockMinimo"),
    notas: opcional(formData, "notas"),
  };
}

function validar(formData: FormData) {
  const parsed = itemSchema.safeParse(leerDatos(formData));
  if (!parsed.success) {
    return { ok: false as const, error: primerError(parsed.error) };
  }
  return { ok: true as const, datos: parsed.data };
}

/** Alta de un ingrediente o utensilio de barra. */
export async function crearIngrediente(
  formData: FormData,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  const resultado = validar(formData);
  if (!resultado.ok) return { ok: false, error: resultado.error };

  const { datos } = resultado;
  const nombreNormalizado = normalizarNombre(datos.nombre);

  try {
    const existente = await db
      .select({ id: comidaIngredientes.id })
      .from(comidaIngredientes)
      .where(eq(comidaIngredientes.nombreNormalizado, nombreNormalizado))
      .limit(1);

    if (existente.length > 0) {
      return {
        ok: false,
        error: `Ya tenés "${datos.nombre}" en la despensa. Editalo para cambiar la cantidad.`,
      };
    }

    const [creado] = await db
      .insert(comidaIngredientes)
      .values({
        ...datos,
        nombreNormalizado,
        creadoEn: new Date().toISOString(),
      })
      .returning({ id: comidaIngredientes.id });

    invalidarComida();
    return { ok: true, id: creado.id };
  } catch (error) {
    console.error("[comida] Error al crear ingrediente:", error);
    return { ok: false, error: "No se pudo guardar el ítem" };
  }
}

/** Edición completa de un ítem del inventario. */
export async function actualizarIngrediente(
  id: number,
  formData: FormData,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  if (!idValido(id)) return { ok: false, error: "Ítem inválido" };

  const resultado = validar(formData);
  if (!resultado.ok) return { ok: false, error: resultado.error };

  const { datos } = resultado;
  const nombreNormalizado = normalizarNombre(datos.nombre);

  try {
    const existente = await db
      .select({ id: comidaIngredientes.id })
      .from(comidaIngredientes)
      .where(eq(comidaIngredientes.nombreNormalizado, nombreNormalizado))
      .limit(1);

    if (existente.length > 0 && existente[0].id !== id) {
      return {
        ok: false,
        error: `Ya tenés "${datos.nombre}" en la despensa.`,
      };
    }

    await db
      .update(comidaIngredientes)
      .set({
        ...datos,
        nombreNormalizado,
        actualizadoEn: new Date().toISOString(),
      })
      .where(eq(comidaIngredientes.id, id));

    invalidarComida();
    return { ok: true, id };
  } catch (error) {
    console.error("[comida] Error al actualizar ingrediente:", error);
    return { ok: false, error: "No se pudo actualizar el ítem" };
  }
}

/** Ajuste rápido de cantidad desde la tabla (sin abrir el formulario). */
export async function ajustarCantidad(
  id: number,
  cantidad: number,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  if (!idValido(id)) return { ok: false, error: "Ítem inválido" };
  if (!Number.isFinite(cantidad) || cantidad < 0) {
    return { ok: false, error: "La cantidad no puede ser negativa" };
  }

  try {
    await db
      .update(comidaIngredientes)
      .set({
        cantidad: Number(cantidad.toFixed(3)),
        actualizadoEn: new Date().toISOString(),
      })
      .where(eq(comidaIngredientes.id, id));

    invalidarComida();
    return { ok: true, id };
  } catch (error) {
    console.error("[comida] Error al ajustar cantidad:", error);
    return { ok: false, error: "No se pudo ajustar la cantidad" };
  }
}

export async function eliminarIngrediente(
  id: number,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  if (!idValido(id)) return { ok: false, error: "Ítem inválido" };

  try {
    await db.delete(comidaIngredientes).where(eq(comidaIngredientes.id, id));
    invalidarComida();
    return { ok: true };
  } catch (error) {
    console.error("[comida] Error al eliminar ingrediente:", error);
    return { ok: false, error: "No se pudo eliminar el ítem" };
  }
}

const descuentoSchema = z.array(
  z.object({
    ingredienteId: z.number().int().positive(),
    cantidad: z.number().positive().max(1_000_000),
  }),
);

/**
 * Descuenta stock confirmado por el usuario. Nunca se llama automáticamente:
 * la UI muestra las cantidades propuestas y las deja editar antes.
 */
export async function descontarStock(
  descuentos: Array<{ ingredienteId: number; cantidad: number }>,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  const parsed = descuentoSchema.safeParse(descuentos);
  if (!parsed.success) return { ok: false, error: primerError(parsed.error) };

  try {
    await db.transaction(async (tx) => {
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
    return { ok: true };
  } catch (error) {
    console.error("[comida] Error al descontar stock:", error);
    return { ok: false, error: "No se pudo descontar el stock" };
  }
}
