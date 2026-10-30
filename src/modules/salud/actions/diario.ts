"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { requireAuthorizedUser } from "@/lib/auth";
import { REGEX_FECHA } from "../lib/fechas";
import { invalidarSalud } from "../lib/invalidar";
import { saludRegistrosDiarios } from "../schema";
import type { ResultadoAccion } from "./episodios";

function texto(formData: FormData, clave: string) {
  const valor = formData.get(clave);
  return typeof valor === "string" ? valor.trim() : "";
}

function numero(formData: FormData, clave: string) {
  const valor = texto(formData, clave).replace(",", ".");
  if (valor === "") return null;
  const parsed = Number(valor);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

const diarioSchema = z.object({
  fecha: z.string().regex(REGEX_FECHA, "Fecha inválida"),
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
});

function leerDatos(formData: FormData) {
  const opcional = (clave: string) => {
    const valor = texto(formData, clave);
    return valor === "" ? null : valor;
  };

  return {
    fecha: texto(formData, "fecha"),
    horasSueno: numero(formData, "horasSueno"),
    calidadSueno: numero(formData, "calidadSueno"),
    vasosAgua: numero(formData, "vasosAgua"),
    nivelEstres: numero(formData, "nivelEstres"),
    horasPantalla: numero(formData, "horasPantalla"),
    tazasCafeina: numero(formData, "tazasCafeina"),
    comidasOmitidas: numero(formData, "comidasOmitidas"),
    actividadMin: numero(formData, "actividadMin"),
    animo: numero(formData, "animo"),
    pesoKg: numero(formData, "pesoKg"),
    notas: opcional("notas"),
  };
}

export async function guardarRegistroDiario(
  formData: FormData,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  const parsed = diarioSchema.safeParse(leerDatos(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const { fecha, ...valores } = parsed.data;

  try {
    await db
      .insert(saludRegistrosDiarios)
      .values({
        fecha,
        ...valores,
        creadoEn: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: saludRegistrosDiarios.fecha,
        set: { ...valores, actualizadoEn: new Date().toISOString() },
      });

    invalidarSalud();
    return { ok: true };
  } catch (error) {
    console.error("[salud] Error al guardar el registro diario:", error);
    return { ok: false, error: "No se pudo guardar el registro del día" };
  }
}

export async function eliminarRegistroDiario(
  id: number,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Registro inválido" };
  }

  try {
    await db
      .delete(saludRegistrosDiarios)
      .where(eq(saludRegistrosDiarios.id, id));

    invalidarSalud();
    return { ok: true };
  } catch (error) {
    console.error("[salud] Error al eliminar el registro diario:", error);
    return { ok: false, error: "No se pudo eliminar el registro" };
  }
}
