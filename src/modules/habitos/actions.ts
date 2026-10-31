"use server";

import { requireAuthorizedUser } from "@/lib/auth";
import { db } from "@/db";
import {
  habitos,
  habitoRegistros,
  githubActividad,
  HABITOS_TAG,
  GITHUB_TAG,
  type NuevoHabito,
  type NuevoHabitoRegistro,
} from "./schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";

const invalidarCacheHabitos = () => {
  updateTag(HABITOS_TAG);
  updateTag(GITHUB_TAG);
};

const idSchema = z.coerce.number().int().positive();

// ---------------------------------------------------------------------------
// Hábitos
// ---------------------------------------------------------------------------

const habitoSchema = z.object({
  titulo: z.string().trim().min(1, "El título es obligatorio").max(120),
  descripcion: z.string().trim().max(500).optional().nullable(),
  tipo: z.enum(["bueno", "malo"]),
  color: z.string().trim().min(1),
  emoji: z.string().trim().max(10).optional().nullable(),
  frecuencia: z.enum(["diaria"]),
});

export type ResultadoHabito =
  | { ok: true; id: number }
  | { ok: false; error: string };

export async function crearHabito(
  datos: Omit<NuevoHabito, "creadoEn" | "actualizadoEn">,
): Promise<ResultadoHabito> {
  await requireAuthorizedUser();

  const parsed = habitoSchema.safeParse(datos);
  if (!parsed.success) {
    return { ok: false, error: "Datos del hábito inválidos" };
  }

  const ahora = new Date().toISOString();

  try {
    const [insertado] = await db
      .insert(habitos)
      .values({
        ...parsed.data,
        creadoEn: ahora,
        actualizadoEn: ahora,
      })
      .returning({ id: habitos.id });

    invalidarCacheHabitos();
    revalidatePath("/habitos");
    revalidatePath("/");

    return { ok: true, id: insertado.id };
  } catch (error) {
    console.error("No se pudo crear el hábito:", error);
    return { ok: false, error: "No se pudo crear el hábito" };
  }
}

export async function actualizarHabito(
  id: number,
  datos: Partial<Omit<NuevoHabito, "id" | "creadoEn" | "actualizadoEn">>,
): Promise<ResultadoHabito> {
  await requireAuthorizedUser();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, error: "ID de hábito inválido" };
  }

  const parcial = habitoSchema.partial().safeParse(datos);
  if (!parcial.success) {
    return { ok: false, error: "Datos del hábito inválidos" };
  }

  try {
    const existente = await db
      .select({ id: habitos.id })
      .from(habitos)
      .where(eq(habitos.id, parsedId.data))
      .limit(1);

    if (!existente.length) {
      return { ok: false, error: "El hábito ya no existe" };
    }

    await db
      .update(habitos)
      .set({
        ...parcial.data,
        actualizadoEn: new Date().toISOString(),
      })
      .where(eq(habitos.id, parsedId.data));

    invalidarCacheHabitos();
    revalidatePath("/habitos");
    revalidatePath("/");

    return { ok: true, id: parsedId.data };
  } catch (error) {
    console.error("No se pudo actualizar el hábito:", error);
    return { ok: false, error: "No se pudo actualizar el hábito" };
  }
}

export async function eliminarHabito(id: number): Promise<ResultadoHabito> {
  await requireAuthorizedUser();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, error: "ID de hábito inválido" };
  }

  try {
    await db.delete(habitos).where(eq(habitos.id, parsedId.data));

    invalidarCacheHabitos();
    revalidatePath("/habitos");
    revalidatePath("/");

    return { ok: true, id: parsedId.data };
  } catch (error) {
    console.error("No se pudo eliminar el hábito:", error);
    return { ok: false, error: "No se pudo eliminar el hábito" };
  }
}

export async function alternarActivoHabito(
  id: number,
): Promise<ResultadoHabito> {
  await requireAuthorizedUser();

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, error: "ID de hábito inválido" };
  }

  try {
    const [existente] = await db
      .select({ activo: habitos.activo })
      .from(habitos)
      .where(eq(habitos.id, parsedId.data))
      .limit(1);

    if (!existente) {
      return { ok: false, error: "El hábito ya no existe" };
    }

    await db
      .update(habitos)
      .set({
        activo: !existente.activo,
        actualizadoEn: new Date().toISOString(),
      })
      .where(eq(habitos.id, parsedId.data));

    invalidarCacheHabitos();
    revalidatePath("/habitos");
    revalidatePath("/");

    return { ok: true, id: parsedId.data };
  } catch (error) {
    console.error("No se pudo alternar el hábito:", error);
    return { ok: false, error: "No se pudo cambiar el estado del hábito" };
  }
}

// ---------------------------------------------------------------------------
// Registros diarios (check-in / checkbox)
// ---------------------------------------------------------------------------

const registroSchema = z.object({
  habitoId: z.coerce.number().int().positive(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  completado: z.boolean(),
  notas: z.string().trim().max(500).optional().nullable(),
});

export type ResultadoRegistro =
  | { ok: true; id: number }
  | { ok: false; error: string };

export async function setRegistroDiario(
  datos: NuevoHabitoRegistro,
): Promise<ResultadoRegistro> {
  await requireAuthorizedUser();

  const parsed = registroSchema.safeParse(datos);
  if (!parsed.success) {
    return { ok: false, error: "Datos del registro inválidos" };
  }

  const { habitoId, fecha, completado, notas } = parsed.data;

  try {
    const existente = await db
      .select({ id: habitoRegistros.id })
      .from(habitoRegistros)
      .where(
        and(
          eq(habitoRegistros.habitoId, habitoId),
          eq(habitoRegistros.fecha, fecha),
        ),
      )
      .limit(1);

    const ahora = new Date().toISOString();

    if (existente.length) {
      await db
        .update(habitoRegistros)
        .set({
          completado,
          notas: notas ?? null,
        })
        .where(eq(habitoRegistros.id, existente[0].id));
    } else {
      await db.insert(habitoRegistros).values({
        habitoId,
        fecha,
        completado,
        notas: notas ?? null,
        creadoEn: ahora,
      });
    }

    invalidarCacheHabitos();
    revalidatePath("/habitos");
    revalidatePath("/");

    return { ok: true, id: existente.length ? existente[0].id : -1 };
  } catch (error) {
    console.error("No se pudo guardar el registro diario:", error);
    return { ok: false, error: "No se pudo guardar el registro" };
  }
}

// ---------------------------------------------------------------------------
// Actividad GitHub
// ---------------------------------------------------------------------------

const githubActividadSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  commits: z.coerce.number().int().min(0).default(0),
  pullRequests: z.coerce.number().int().min(0).default(0),
  issues: z.coerce.number().int().min(0).default(0),
});

export async function guardarGithubActividad(
  datos: Array<{
    fecha: string;
    commits: number;
    pullRequests: number;
    issues: number;
  }>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAuthorizedUser();

  if (!datos.length) {
    return { ok: true };
  }

  try {
    const valores = datos.map((d) => {
      const parsed = githubActividadSchema.safeParse(d);
      return parsed.success ? parsed.data : null;
    }).filter((d): d is { fecha: string; commits: number; pullRequests: number; issues: number } => d !== null);

    const ahora = new Date().toISOString();

    // Borrar entradas existentes para esas fechas antes de insertar (upsert manual)
    const fechasUnicas = [...new Set(valores.map((d) => d.fecha))];
    for (const fecha of fechasUnicas) {
      await db.delete(githubActividad).where(eq(githubActividad.fecha, fecha));
    }

    await db.insert(githubActividad).values(
      valores.map((d) => ({
        fecha: d.fecha,
        commits: d.commits,
        pullRequests: d.pullRequests,
        issues: d.issues,
        actualizadoEn: ahora,
      })),
    );

    invalidarCacheHabitos();
    revalidatePath("/habitos");
    revalidatePath("/");

    return { ok: true };
  } catch (error) {
    console.error("No se pudo guardar la actividad de GitHub:", error);
    return { ok: false, error: "No se pudo guardar la actividad de GitHub" };
  }
}
