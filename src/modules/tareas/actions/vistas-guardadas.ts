"use server";

import { requireAuthorizedUser } from "@/lib/auth";
import { currentUser } from "@clerk/nextjs/server";
import { getVistasGuardadas, type VistaGuardada } from "@/modules/tareas/queries/vistas-guardadas";
import { z } from "zod";
import { idSchema } from "@/modules/tareas/lib/validacion";
import {
  crearVistaGuardada,
  actualizarVistaGuardada,
  borrarVistaGuardada,
} from "@/modules/tareas/queries/vistas-guardadas";
import { refrescarTareas } from "@/modules/tareas/lib/refrescar";
import { errorAccion, type ResultadoAccion } from "@/modules/tareas/lib/resultado";

const alcanceSchema = z.enum(["global", "proyecto"]);

export async function guardarVista(datos: {
  nombre: string;
  alcance: "global" | "proyecto";
  proyectoId?: number | null;
  config: unknown;
}): Promise<ResultadoAccion<{ id: number }>> {
  await requireAuthorizedUser();
  const user = await currentUser();
  if (!user) return errorAccion("No autenticado");
  const nombre = z.string().trim().min(1).max(60).safeParse(datos.nombre);
  if (!nombre.success) return errorAccion("Nombre inválido");
  const alcance = alcanceSchema.safeParse(datos.alcance);
  if (!alcance.success) return errorAccion("Alcance inválido");

  const creada = await crearVistaGuardada({
    usuarioId: user.id,
    nombre: nombre.data,
    alcance: alcance.data,
    proyectoId: datos.proyectoId ?? null,
    config: datos.config,
  });
  refrescarTareas();
  return { ok: true, id: creada.id };
}

export async function renombrarVistaGuardada(
  id: number,
  nombre: string,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(id).success) return errorAccion("Vista inválida");
  const parsed = z.string().trim().min(1).max(60).safeParse(nombre);
  if (!parsed.success) return errorAccion("Nombre inválido");
  await actualizarVistaGuardada(id, { nombre: parsed.data });
  refrescarTareas();
  return { ok: true };
}

export async function eliminarVistaGuardada(id: number): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(id).success) return errorAccion("Vista inválida");
  await borrarVistaGuardada(id);
  refrescarTareas();
  return { ok: true };
}

export async function listarVistasGuardadas(): Promise<VistaGuardada[]> {
  await requireAuthorizedUser();
  const user = await currentUser();
  if (!user) return [];
  return getVistasGuardadas(user.id);
}

export async function obtenerVistaGuardada(
  id: number,
): Promise<VistaGuardada | null> {
  await requireAuthorizedUser();
  const lista = await listarVistasGuardadas();
  return lista.find((v) => v.id === id) ?? null;
}