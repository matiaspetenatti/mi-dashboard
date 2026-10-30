"use server";

import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { requireAuthorizedUser } from "@/lib/auth";
import { invalidarComida } from "../lib/invalidar";
import { diasDeSemana, inicioSemana, REGEX_FECHA } from "../lib/semana";
import { comidaMenu, comidaRecetas, type MomentoMenu } from "../schema";
import {
  idValido,
  numero,
  primerError,
  texto,
  type ResultadoAccion,
} from "./tipos";

const MOMENTOS = ["desayuno", "almuerzo", "merienda", "cena"] as const;

const slotEntradaSchema = z.object({
  titulo: z.string().trim().min(2).max(160),
  minutos: z.number().int().min(1).max(600).nullable(),
  ingredientes: z.array(z.string().trim().min(1)).max(40),
  reutiliza: z.string().max(200).nullable(),
});

const diaEntradaSchema = z.object({
  fecha: z.string().regex(REGEX_FECHA, "Fecha inválida"),
  slots: z.record(z.string(), slotEntradaSchema),
});

const menuEntradaSchema = z.array(diaEntradaSchema).min(1).max(7);

export type SlotMenuEntrada = z.infer<typeof slotEntradaSchema>;
export type DiaMenuEntrada = z.infer<typeof diaEntradaSchema>;

/** Guarda (o reemplaza) los slots que devolvió la IA o cargó el usuario. */
export async function guardarMenuSemana(
  dias: DiaMenuEntrada[],
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  const parsed = menuEntradaSchema.safeParse(dias);
  if (!parsed.success) return { ok: false, error: primerError(parsed.error) };

  try {
    const ahora = new Date().toISOString();
    let agregados = 0;

    await db.transaction(async (tx) => {
      for (const dia of parsed.data) {
        for (const [momento, slot] of Object.entries(dia.slots)) {
          if (!MOMENTOS.includes(momento as MomentoMenu)) continue;

          await tx
            .insert(comidaMenu)
            .values({
              dia: dia.fecha,
              momento: momento as MomentoMenu,
              titulo: slot.titulo,
              minutos: slot.minutos,
              ingredientes: slot.ingredientes,
              reutiliza: slot.reutiliza,
              creadoEn: ahora,
            })
            .onConflictDoUpdate({
              target: [comidaMenu.dia, comidaMenu.momento],
              set: {
                titulo: slot.titulo,
                minutos: slot.minutos,
                ingredientes: slot.ingredientes,
                reutiliza: slot.reutiliza,
                actualizadoEn: ahora,
              },
            });

          agregados += 1;
        }
      }
    });

    invalidarComida();
    return { ok: true, agregados };
  } catch (error) {
    console.error("[comida] Error al guardar el menú:", error);
    return { ok: false, error: "No se pudo guardar el menú semanal" };
  }
}

const diaMomento = z.object({
  dia: z.string().regex(REGEX_FECHA, "Fecha inválida"),
  momento: z.enum(MOMENTOS),
});

/**
 * Edita un slot: título libre, receta del recetario, minutos y notas.
 * Si viene `recetaId`, se copian sus datos al slot.
 */
export async function actualizarSlot(
  formData: FormData,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  const base = diaMomento.safeParse({
    dia: texto(formData, "dia"),
    momento: texto(formData, "momento"),
  });
  if (!base.success) return { ok: false, error: primerError(base.error) };

  const recetaIdValor = numero(formData, "recetaId");
  const recetaId =
    recetaIdValor !== null && idValido(recetaIdValor) ? recetaIdValor : null;
  const titulo = texto(formData, "titulo");
  const minutos = numero(formData, "minutos");
  const reutiliza = texto(formData, "reutiliza") || null;
  const ingredientes = texto(formData, "ingredientes")
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean);

  if (!recetaId && titulo.length < 2) {
    return { ok: false, error: "Escribí un título o elegí una receta" };
  }

  try {
    let valores = {
      titulo: titulo || null,
      minutos: minutos !== null && minutos > 0 ? Math.round(minutos) : null,
      reutiliza,
      ingredientes,
      recetaId,
    };

    if (recetaId) {
      const [receta] = await db
        .select()
        .from(comidaRecetas)
        .where(eq(comidaRecetas.id, recetaId))
        .limit(1);

      if (!receta) return { ok: false, error: "La receta no existe" };

      valores = {
        titulo: receta.titulo,
        minutos: receta.minutos,
        reutiliza,
        ingredientes: receta.ingredientes.map((ingrediente) =>
          ingrediente.cantidad === null
            ? ingrediente.nombre
            : `${ingrediente.cantidad} ${ingrediente.unidad} de ${ingrediente.nombre}`,
        ),
        recetaId,
      };
    }

    const ahora = new Date().toISOString();

    await db
      .insert(comidaMenu)
      .values({
        dia: base.data.dia,
        momento: base.data.momento,
        ...valores,
        creadoEn: ahora,
      })
      .onConflictDoUpdate({
        target: [comidaMenu.dia, comidaMenu.momento],
        set: { ...valores, actualizadoEn: ahora },
      });

    invalidarComida();
    return { ok: true };
  } catch (error) {
    console.error("[comida] Error al actualizar el slot:", error);
    return { ok: false, error: "No se pudo actualizar el menú" };
  }
}

export async function alternarSlotHecho(
  dia: string,
  momento: MomentoMenu,
  hecho: boolean,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  const parsed = diaMomento.safeParse({ dia, momento });
  if (!parsed.success) return { ok: false, error: primerError(parsed.error) };

  try {
    await db
      .update(comidaMenu)
      .set({ hecho, actualizadoEn: new Date().toISOString() })
      .where(
        and(
          eq(comidaMenu.dia, parsed.data.dia),
          eq(comidaMenu.momento, parsed.data.momento),
        ),
      );

    invalidarComida();
    return { ok: true };
  } catch (error) {
    console.error("[comida] Error al marcar el slot:", error);
    return { ok: false, error: "No se pudo actualizar el plato" };
  }
}

export async function eliminarSlot(
  dia: string,
  momento: MomentoMenu,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  const parsed = diaMomento.safeParse({ dia, momento });
  if (!parsed.success) return { ok: false, error: primerError(parsed.error) };

  try {
    await db
      .delete(comidaMenu)
      .where(
        and(
          eq(comidaMenu.dia, parsed.data.dia),
          eq(comidaMenu.momento, parsed.data.momento),
        ),
      );

    invalidarComida();
    return { ok: true };
  } catch (error) {
    console.error("[comida] Error al eliminar el slot:", error);
    return { ok: false, error: "No se pudo eliminar el plato" };
  }
}

/** Borra todos los slots de una semana. */
export async function limpiarSemana(semana: string): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  if (!REGEX_FECHA.test(semana)) {
    return { ok: false, error: "Semana inválida" };
  }

  const inicio = inicioSemana(semana);
  const dias = diasDeSemana(inicio);
  const fin = dias[dias.length - 1];

  try {
    await db
      .delete(comidaMenu)
      .where(and(gte(comidaMenu.dia, inicio), lte(comidaMenu.dia, fin)));

    invalidarComida();
    return { ok: true };
  } catch (error) {
    console.error("[comida] Error al limpiar la semana:", error);
    return { ok: false, error: "No se pudo limpiar la semana" };
  }
}
