"use server";

import { requireAuthorizedUser } from "@/lib/auth";
import { db } from "@/db";
import {
  proyectos,
  vistasProyecto,
} from "@/modules/tareas/schema";
import { asc, eq } from "drizzle-orm";
import {
  idSchema,
  vistaActualizarSchema,
  vistaCrearSchema,
} from "@/modules/tareas/lib/validacion";
import {
  configParaTipo,
  parseConfigVista,
} from "@/modules/tareas/lib/config-vista";
import { refrescarTareas } from "@/modules/tareas/lib/refrescar";
import { errorAccion, type ResultadoAccion } from "@/modules/tareas/lib/resultado";

export async function crearVista(datos: {
  proyectoId: number;
  nombre: string;
  tipo: string;
  config?: unknown;
}): Promise<ResultadoAccion<{ id: number }>> {
  await requireAuthorizedUser();
  const parsed = vistaCrearSchema.safeParse(datos);
  if (!parsed.success) {
    return errorAccion(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const [proyecto] = await db
    .select({ id: proyectos.id })
    .from(proyectos)
    .where(eq(proyectos.id, parsed.data.proyectoId));
  if (!proyecto) return errorAccion("El proyecto no existe");

  const vistas = await db
    .select({ posicion: vistasProyecto.posicion })
    .from(vistasProyecto)
    .where(eq(vistasProyecto.proyectoId, parsed.data.proyectoId));
  const posicion =
    vistas.length === 0
      ? 0
      : Math.max(...vistas.map((vista) => vista.posicion)) + 1;

  const config =
    parsed.data.config !== undefined
      ? parseConfigVista(parsed.data.config)
      : configParaTipo(parsed.data.tipo);

  const [nueva] = await db
    .insert(vistasProyecto)
    .values({
      proyectoId: parsed.data.proyectoId,
      nombre: parsed.data.nombre,
      tipo: parsed.data.tipo,
      config,
      posicion,
      predeterminada: vistas.length === 0,
    })
    .returning({ id: vistasProyecto.id });

  refrescarTareas();
  return { ok: true, id: nueva.id };
}

export async function actualizarVista(
  id: number,
  datos: { nombre?: string; tipo?: string; config?: unknown },
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(id).success) return errorAccion("Vista inválida");
  const parsed = vistaActualizarSchema.safeParse(datos);
  if (!parsed.success) {
    return errorAccion(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const [vista] = await db
    .select()
    .from(vistasProyecto)
    .where(eq(vistasProyecto.id, id));
  if (!vista) return errorAccion("La vista no existe");

  const config =
    parsed.data.config !== undefined
      ? parseConfigVista(parsed.data.config)
      : parsed.data.tipo && parsed.data.tipo !== vista.tipo
        ? configParaTipo(parsed.data.tipo)
        : vista.config;

  await db
    .update(vistasProyecto)
    .set({
      ...(parsed.data.nombre !== undefined ? { nombre: parsed.data.nombre } : {}),
      ...(parsed.data.tipo !== undefined ? { tipo: parsed.data.tipo } : {}),
      config,
    })
    .where(eq(vistasProyecto.id, id));

  refrescarTareas();
  return { ok: true };
}

export async function borrarVista(id: number): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(id).success) return errorAccion("Vista inválida");

  const [vista] = await db
    .select()
    .from(vistasProyecto)
    .where(eq(vistasProyecto.id, id));
  if (!vista) return errorAccion("La vista no existe");

  const vistas = await db
    .select({ id: vistasProyecto.id })
    .from(vistasProyecto)
    .where(eq(vistasProyecto.proyectoId, vista.proyectoId))
    .orderBy(asc(vistasProyecto.posicion), asc(vistasProyecto.id));
  if (vistas.length <= 1) {
    return errorAccion("El proyecto necesita al menos una vista");
  }

  await db.delete(vistasProyecto).where(eq(vistasProyecto.id, id));

  if (vista.predeterminada) {
    const siguiente = vistas.find((otra) => otra.id !== id);
    if (siguiente) {
      await db
        .update(vistasProyecto)
        .set({ predeterminada: true })
        .where(eq(vistasProyecto.id, siguiente.id));
    }
  }

  refrescarTareas();
  return { ok: true };
}

export async function marcarVistaPredeterminada(
  id: number,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(id).success) return errorAccion("Vista inválida");

  const [vista] = await db
    .select()
    .from(vistasProyecto)
    .where(eq(vistasProyecto.id, id));
  if (!vista) return errorAccion("La vista no existe");

  await db
    .update(vistasProyecto)
    .set({ predeterminada: false })
    .where(eq(vistasProyecto.proyectoId, vista.proyectoId));
  await db
    .update(vistasProyecto)
    .set({ predeterminada: true })
    .where(eq(vistasProyecto.id, id));

  refrescarTareas();
  return { ok: true };
}

export async function duplicarVista(
  id: number,
  nombre: string,
): Promise<ResultadoAccion<{ id: number }>> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(id).success) return errorAccion("Vista inválida");

  const [vista] = await db
    .select()
    .from(vistasProyecto)
    .where(eq(vistasProyecto.id, id));
  if (!vista) return errorAccion("La vista no existe");

  const parsed = vistaCrearSchema.safeParse({
    proyectoId: vista.proyectoId,
    nombre: nombre.trim() || `${vista.nombre} (copia)`,
    tipo: vista.tipo,
    config: vista.config,
  });
  if (!parsed.success) return errorAccion("Nombre inválido");

  const vistas = await db
    .select({ posicion: vistasProyecto.posicion })
    .from(vistasProyecto)
    .where(eq(vistasProyecto.proyectoId, vista.proyectoId));
  const posicion =
    vistas.length === 0
      ? 0
      : Math.max(...vistas.map((otra) => otra.posicion)) + 1;

  const [nueva] = await db
    .insert(vistasProyecto)
    .values({
      proyectoId: vista.proyectoId,
      nombre: parsed.data.nombre,
      tipo: vista.tipo,
      config: parseConfigVista(parsed.data.config),
      posicion,
      predeterminada: false,
    })
    .returning({ id: vistasProyecto.id });

  refrescarTareas();
  return { ok: true, id: nueva.id };
}
