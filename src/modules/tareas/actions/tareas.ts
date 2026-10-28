"use server";

import { requireAuthorizedUser } from "@/lib/auth";
import { db } from "@/db";
import {
  proyectos,
  tareas,
  tareasEtiquetas,
  type NuevaTarea,
} from "@/modules/tareas/schema";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { fechaHoy } from "@/lib/format";
import {
  idSchema,
  tareaActualizarSchema,
  tareaCrearSchema,
  tituloSchema,
} from "@/modules/tareas/lib/validacion";
import { refrescarTareas } from "@/modules/tareas/lib/refrescar";
import { errorAccion, type ResultadoAccion } from "@/modules/tareas/lib/resultado";
import { siguientePosicionEstado } from "@/modules/tareas/actions/_comun";
import {
  aplicarCambioEstado,
  asignarEtiquetas,
  cargarTareaConEstado,
  estadosDeProyecto,
  validarEstadoDeProyecto,
} from "@/modules/tareas/actions/_comun";
import { estadoCompletado, estadoParaCategoria } from "@/modules/tareas/lib/orden";

export async function crearTarea(datos: {
  proyectoId: number;
  estadoId: number;
  parentId?: number | null;
  titulo: string;
  descripcion?: string | null;
  prioridad?: string | null;
  fechaInicio?: string | null;
  fechaLimite?: string | null;
  recurrencia?: string | null;
  recurrenciaCada?: number;
  etiquetaIds?: number[];
}): Promise<ResultadoAccion<{ id: number }>> {
  await requireAuthorizedUser();
  const parsed = tareaCrearSchema.safeParse(datos);
  if (!parsed.success) {
    return errorAccion(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const {
    proyectoId,
    estadoId,
    parentId,
    titulo,
    descripcion,
    prioridad,
    fechaInicio,
    recurrencia,
    etiquetaIds,
  } = parsed.data;

  const [proyecto] = await db
    .select({ id: proyectos.id })
    .from(proyectos)
    .where(eq(proyectos.id, proyectoId));
  if (!proyecto) return errorAccion("El proyecto no existe");

  const estado = await validarEstadoDeProyecto(proyectoId, estadoId);
  if (!estado) return errorAccion("El estado no pertenece al proyecto");

  if (parentId) {
    const padre = await cargarTareaConEstado(parentId);
    if (!padre || padre.tarea.proyectoId !== proyectoId || padre.tarea.parentId) {
      return errorAccion("La tarea padre no es válida");
    }
  }

  // una tarea repetitiva necesita una fecha base
  const fechaLimite =
    parsed.data.fechaLimite ?? (recurrencia ? fechaHoy() : null);
  const posicion = await siguientePosicionEstado(estadoId);

  const [nueva] = await db
    .insert(tareas)
    .values({
      proyectoId,
      estadoId,
      parentId: parentId ?? null,
      titulo,
      descripcion: descripcion || null,
      prioridad: (prioridad as NuevaTarea["prioridad"]) ?? null,
      fechaInicio: fechaInicio ?? null,
      fechaLimite,
      recurrencia: (recurrencia as NuevaTarea["recurrencia"]) ?? null,
      recurrenciaCada: recurrencia ? (parsed.data.recurrenciaCada ?? 1) : 1,
      posicion,
    })
    .returning({ id: tareas.id });

  if (etiquetaIds?.length) {
    await asignarEtiquetas(nueva.id, etiquetaIds);
  }

  refrescarTareas();
  return { ok: true, id: nueva.id };
}

export async function actualizarTarea(
  id: number,
  datos: {
    titulo?: string;
    descripcion?: string | null;
    estadoId?: number;
    prioridad?: string | null;
    fechaInicio?: string | null;
    fechaLimite?: string | null;
    recurrencia?: string | null;
    recurrenciaCada?: number;
    etiquetaIds?: number[];
  },
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(id).success) return errorAccion("Tarea inválida");
  const parsed = tareaActualizarSchema.safeParse(datos);
  if (!parsed.success) {
    return errorAccion(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const fila = await cargarTareaConEstado(id);
  if (!fila) return errorAccion("La tarea no existe");

  const cambios = parsed.data;
  const set: Partial<NuevaTarea> = {};

  if (cambios.titulo !== undefined) set.titulo = cambios.titulo;
  if (cambios.descripcion !== undefined) {
    set.descripcion = cambios.descripcion || null;
  }
  if (cambios.prioridad !== undefined) {
    set.prioridad = (cambios.prioridad as NuevaTarea["prioridad"]) ?? null;
  }
  if (cambios.fechaInicio !== undefined) {
    set.fechaInicio = cambios.fechaInicio || null;
  }
  if (cambios.fechaLimite !== undefined) {
    set.fechaLimite = cambios.fechaLimite || null;
  }
  if (cambios.recurrencia !== undefined) {
    set.recurrencia = (cambios.recurrencia as NuevaTarea["recurrencia"]) ?? null;
    if (!cambios.recurrencia) set.recurrenciaCada = 1;
  }
  if (cambios.recurrenciaCada !== undefined && cambios.recurrencia) {
    set.recurrenciaCada = cambios.recurrenciaCada;
  }

  // si se activa la recurrencia y no hay fecha, arranca hoy
  if (
    (cambios.recurrencia ?? fila.tarea.recurrencia) &&
    !(cambios.fechaLimite ?? fila.tarea.fechaLimite)
  ) {
    set.fechaLimite = fechaHoy();
  }

  await db
    .update(tareas)
    .set({ ...set, actualizadaEn: sql`(datetime('now'))` })
    .where(eq(tareas.id, id));

  if (cambios.estadoId !== undefined && cambios.estadoId !== fila.tarea.estadoId) {
    const destino = await validarEstadoDeProyecto(
      fila.tarea.proyectoId,
      cambios.estadoId,
    );
    if (!destino) return errorAccion("El estado no pertenece al proyecto");

    await aplicarCambioEstado(fila.tarea, fila.estado, destino);
  }

  if (cambios.etiquetaIds !== undefined) {
    await asignarEtiquetas(id, cambios.etiquetaIds);
  }

  refrescarTareas();
  return { ok: true };
}

export async function moverTarea(
  id: number,
  estadoId: number,
  idsDestino?: number[],
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(id).success || !idSchema.safeParse(estadoId).success) {
    return errorAccion("Datos inválidos");
  }

  const fila = await cargarTareaConEstado(id);
  if (!fila) return errorAccion("La tarea no existe");

  const destino = await validarEstadoDeProyecto(
    fila.tarea.proyectoId,
    estadoId,
  );
  if (!destino) return errorAccion("El estado no pertenece al proyecto");

  const lista = z
    .array(idSchema)
    .max(500)
    .optional()
    .safeParse(idsDestino);
  if (!lista.success) return errorAccion("Orden inválido");

  const ids = lista.data;
  if (ids?.length) {
    const filas = await db
      .select({ id: tareas.id, proyectoId: tareas.proyectoId })
      .from(tareas)
      .where(inArray(tareas.id, ids));
    if (
      filas.length !== ids.length ||
      filas.some((filaTarea) => filaTarea.proyectoId !== fila.tarea.proyectoId)
    ) {
      return errorAccion("El orden contiene tareas inválidas");
    }
  }

  const indice = ids?.indexOf(id) ?? -1;
  const posicion =
    ids && indice >= 0
      ? (indice + 1) * 1024
      : ids && indice < 0
        ? (ids.length + 1) * 1024
        : undefined;

  await aplicarCambioEstado(fila.tarea, fila.estado, destino, posicion);

  if (ids?.length) {
    for (const [orden, idTarea] of ids.entries()) {
      await db
        .update(tareas)
        .set({ posicion: (orden + 1) * 1024 })
        .where(eq(tareas.id, idTarea));
    }
  }

  refrescarTareas();
  return { ok: true };
}

export async function alternarCompletada(id: number): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(id).success) return errorAccion("Tarea inválida");

  const fila = await cargarTareaConEstado(id);
  if (!fila) return errorAccion("La tarea no existe");

  const estados = await estadosDeProyecto(fila.tarea.proyectoId);
  const destino =
    fila.estado.categoria === "completado"
      ? estadoParaCategoria(estados, "pendiente") ??
        estadoParaCategoria(estados, "en_progreso")
      : estadoCompletado(estados);

  if (!destino) {
    return errorAccion(
      fila.estado.categoria === "completado"
        ? "No hay un estado pendiente en el proyecto"
        : "El proyecto no tiene un estado completado",
    );
  }

  await aplicarCambioEstado(fila.tarea, fila.estado, destino);
  refrescarTareas();
  return { ok: true };
}

export async function borrarTarea(id: number): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(id).success) return errorAccion("Tarea inválida");

  const subtareas = await db
    .select({ id: tareas.id })
    .from(tareas)
    .where(eq(tareas.parentId, id));
  const ids = [id, ...subtareas.map((subtarea) => subtarea.id)];

  await db
    .delete(tareasEtiquetas)
    .where(inArray(tareasEtiquetas.tareaId, ids));
  await db.delete(tareas).where(eq(tareas.parentId, id));
  await db.delete(tareas).where(eq(tareas.id, id));

  refrescarTareas();
  return { ok: true };
}

export async function duplicarTarea(
  id: number,
): Promise<ResultadoAccion<{ id: number }>> {
  await requireAuthorizedUser();
  if (!idSchema.safeParse(id).success) return errorAccion("Tarea inválida");

  const fila = await cargarTareaConEstado(id);
  if (!fila) return errorAccion("La tarea no existe");

  const titulo = `${fila.tarea.titulo} (copia)`.slice(0, 300);
  const posicion = await siguientePosicionEstado(fila.tarea.estadoId);

  const [nueva] = await db
    .insert(tareas)
    .values({
      proyectoId: fila.tarea.proyectoId,
      estadoId: fila.tarea.estadoId,
      parentId: fila.tarea.parentId,
      titulo,
      descripcion: fila.tarea.descripcion,
      prioridad: fila.tarea.prioridad,
      fechaInicio: fila.tarea.fechaInicio,
      fechaLimite: fila.tarea.fechaLimite,
      posicion,
      recurrencia: fila.tarea.recurrencia,
      recurrenciaCada: fila.tarea.recurrenciaCada,
    })
    .returning({ id: tareas.id });

  const [etiquetasTarea, subtareas] = await Promise.all([
    db
      .select({ etiquetaId: tareasEtiquetas.etiquetaId })
      .from(tareasEtiquetas)
      .where(eq(tareasEtiquetas.tareaId, id)),
    db
      .select()
      .from(tareas)
      .where(eq(tareas.parentId, id))
      .orderBy(asc(tareas.posicion), asc(tareas.id)),
  ]);

  if (etiquetasTarea.length > 0) {
    await db
      .insert(tareasEtiquetas)
      .values(
        etiquetasTarea.map((etiqueta) => ({
          tareaId: nueva.id,
          etiquetaId: etiqueta.etiquetaId,
        })),
      )
      .onConflictDoNothing();
  }

  if (subtareas.length > 0) {
    await db.insert(tareas).values(
      subtareas.map((subtarea, indice) => ({
        proyectoId: subtarea.proyectoId,
        estadoId: subtarea.estadoId,
        parentId: nueva.id,
        titulo: subtarea.titulo,
        descripcion: subtarea.descripcion,
        prioridad: subtarea.prioridad,
        fechaInicio: subtarea.fechaInicio,
        fechaLimite: subtarea.fechaLimite,
        posicion: (indice + 1) * 1024,
      })),
    );
  }

  refrescarTareas();
  return { ok: true, id: nueva.id };
}

export async function crearSubtarea(
  parentId: number,
  titulo: string,
): Promise<ResultadoAccion<{ id: number }>> {
  await requireAuthorizedUser();
  const parsedTitulo = tituloSchema.safeParse(titulo);
  if (!parsedTitulo.success || !idSchema.safeParse(parentId).success) {
    return errorAccion("Datos inválidos");
  }

  const padre = await cargarTareaConEstado(parentId);
  if (!padre) return errorAccion("La tarea padre no existe");
  if (padre.tarea.parentId) {
    return errorAccion("Solo se permite un nivel de subtareas");
  }

  const posicion = await siguientePosicionEstado(padre.tarea.estadoId);
  const [nueva] = await db
    .insert(tareas)
    .values({
      proyectoId: padre.tarea.proyectoId,
      estadoId: padre.tarea.estadoId,
      parentId,
      titulo: parsedTitulo.data,
      posicion,
    })
    .returning({ id: tareas.id });

  refrescarTareas();
  return { ok: true, id: nueva.id };
}

export async function moverTareaAProyecto(
  id: number,
  proyectoId: number,
  estadoId: number,
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  if (
    !idSchema.safeParse(id).success ||
    !idSchema.safeParse(proyectoId).success ||
    !idSchema.safeParse(estadoId).success
  ) {
    return errorAccion("Datos inválidos");
  }

  const fila = await cargarTareaConEstado(id);
  if (!fila) return errorAccion("La tarea no existe");
  if (fila.tarea.proyectoId === proyectoId) {
    return errorAccion("La tarea ya pertenece a ese proyecto");
  }

  const destino = await validarEstadoDeProyecto(proyectoId, estadoId);
  if (!destino) return errorAccion("El estado no pertenece al proyecto destino");

  const posicion = await siguientePosicionEstado(estadoId);
  await db
    .update(tareas)
    .set({
      proyectoId,
      estadoId,
      posicion,
      completadaEn:
        destino.categoria === "completado"
          ? sql`(datetime('now'))`
          : null,
      actualizadaEn: sql`(datetime('now'))`,
    })
    .where(eq(tareas.id, id));

  await db
    .update(tareas)
    .set({ proyectoId, estadoId })
    .where(eq(tareas.parentId, id));

  refrescarTareas();
  return { ok: true };
}

export async function reordenarTareas(
  estadoId: number,
  ids: number[],
): Promise<ResultadoAccion> {
  await requireAuthorizedUser();
  const parsed = z.array(idSchema).max(500).safeParse(ids);
  if (!parsed.success || !idSchema.safeParse(estadoId).success) {
    return errorAccion("Orden inválido");
  }

  if (parsed.data.length > 0) {
    const filas = await db
      .select({ id: tareas.id, estadoId: tareas.estadoId })
      .from(tareas)
      .where(inArray(tareas.id, parsed.data));
    if (
      filas.length !== parsed.data.length ||
      filas.some((fila) => fila.estadoId !== estadoId)
    ) {
      return errorAccion("El orden contiene tareas inválidas");
    }
  }

  for (const [indice, id] of parsed.data.entries()) {
    await db
      .update(tareas)
      .set({ posicion: (indice + 1) * 1024 })
      .where(and(eq(tareas.id, id), eq(tareas.estadoId, estadoId)));
  }

  refrescarTareas();
  return { ok: true };
}
