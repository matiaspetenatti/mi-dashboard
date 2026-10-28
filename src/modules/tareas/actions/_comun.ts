import "server-only";

import { and, asc, eq, inArray, like, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  estadosProyecto,
  etiquetas,
  proyectos,
  tareas,
  tareasEtiquetas,
  vistasProyecto,
  type EstadoProyecto,
  type Tarea,
} from "@/modules/tareas/schema";
import { estadosPorDefecto, slugify } from "@/modules/tareas/constantes";
import { estadoInicial } from "@/modules/tareas/lib/orden";
import { vistasIniciales } from "@/modules/tareas/lib/config-vista";
import { fechaHoy, sumarFecha } from "@/lib/format";

export async function slugUnico(nombre: string) {
  const base = slugify(nombre);
  const existentes = await db
    .select({ slug: proyectos.slug })
    .from(proyectos)
    .where(like(proyectos.slug, `${base}%`));
  const usados = new Set(existentes.map((fila) => fila.slug));
  if (!usados.has(base)) return base;

  let indice = 2;
  while (usados.has(`${base}-${indice}`)) indice += 1;
  return `${base}-${indice}`;
}

export async function siguientePosicionProyecto() {
  const [fila] = await db
    .select({ max: sql<number>`coalesce(max(${proyectos.posicion}), 0)` })
    .from(proyectos);
  return (fila?.max ?? 0) + 1024;
}

export async function siguientePosicionEstado(estadoId: number) {
  const [fila] = await db
    .select({ max: sql<number>`coalesce(max(${tareas.posicion}), 0)` })
    .from(tareas)
    .where(eq(tareas.estadoId, estadoId));
  return (fila?.max ?? 0) + 1024;
}

export async function crearDatosInicialesProyecto(proyectoId: number) {
  await db.batch([
    db.insert(estadosProyecto).values(
      estadosPorDefecto.map((estado, indice) => ({
        proyectoId,
        nombre: estado.nombre,
        color: estado.color,
        categoria: estado.categoria,
        posicion: indice,
      })),
    ),
    db.insert(vistasProyecto).values(
      vistasIniciales().map((vista, indice) => ({
        proyectoId,
        nombre: vista.nombre,
        tipo: vista.tipo,
        config: vista.config,
        posicion: indice,
        predeterminada: vista.predeterminada,
      })),
    ),
  ]);
}

export async function estadosDeProyecto(proyectoId: number) {
  return db
    .select()
    .from(estadosProyecto)
    .where(eq(estadosProyecto.proyectoId, proyectoId))
    .orderBy(asc(estadosProyecto.posicion), asc(estadosProyecto.id));
}

export async function cargarTareaConEstado(id: number) {
  const [fila] = await db
    .select({ tarea: tareas, estado: estadosProyecto })
    .from(tareas)
    .innerJoin(estadosProyecto, eq(tareas.estadoId, estadosProyecto.id))
    .where(eq(tareas.id, id));
  return fila ?? null;
}

export async function validarEstadoDeProyecto(
  proyectoId: number,
  estadoId: number,
) {
  const [estado] = await db
    .select()
    .from(estadosProyecto)
    .where(
      and(
        eq(estadosProyecto.id, estadoId),
        eq(estadosProyecto.proyectoId, proyectoId),
      ),
    );
  return estado ?? null;
}

export async function asignarEtiquetas(tareaId: number, ids: number[]) {
  const unicos = [...new Set(ids)];
  await db.delete(tareasEtiquetas).where(eq(tareasEtiquetas.tareaId, tareaId));
  if (unicos.length === 0) return;

  const existentes = await db
    .select({ id: etiquetas.id })
    .from(etiquetas)
    .where(inArray(etiquetas.id, unicos));
  if (existentes.length === 0) return;

  await db
    .insert(tareasEtiquetas)
    .values(existentes.map((etiqueta) => ({ tareaId, etiquetaId: etiqueta.id })))
    .onConflictDoNothing();
}

function diferenciaDias(desde: string, hasta: string) {
  return Math.round(
    (Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) /
      86_400_000,
  );
}

function moverFecha(fecha: string, dias: number) {
  return new Date(
    Date.parse(`${fecha}T00:00:00Z`) + dias * 86_400_000,
  )
    .toISOString()
    .slice(0, 10);
}

export async function crearSiguienteOcurrencia(tarea: Tarea) {
  if (!tarea.recurrencia || tarea.parentId) return null;

  const estados = await estadosDeProyecto(tarea.proyectoId);
  const inicial = estadoInicial(estados);
  if (!inicial) return null;

  const hoy = fechaHoy();
  const base = tarea.fechaLimite ?? tarea.fechaInicio ?? hoy;
  let siguiente = sumarFecha(base, tarea.recurrencia, tarea.recurrenciaCada);
  let vueltas = 0;
  while (siguiente <= hoy && vueltas < 1000) {
    siguiente = sumarFecha(siguiente, tarea.recurrencia, tarea.recurrenciaCada);
    vueltas += 1;
  }

  const nuevoInicio = tarea.fechaInicio
    ? moverFecha(tarea.fechaInicio, diferenciaDias(base, siguiente))
    : null;

  const posicion = await siguientePosicionEstado(inicial.id);
  const [nueva] = await db
    .insert(tareas)
    .values({
      proyectoId: tarea.proyectoId,
      estadoId: inicial.id,
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      prioridad: tarea.prioridad,
      fechaInicio: nuevoInicio,
      fechaLimite: siguiente,
      posicion,
      recurrencia: tarea.recurrencia,
      recurrenciaCada: tarea.recurrenciaCada,
    })
    .returning({ id: tareas.id });

  const [etiquetasTarea, subtareas] = await Promise.all([
    db
      .select({ etiquetaId: tareasEtiquetas.etiquetaId })
      .from(tareasEtiquetas)
      .where(eq(tareasEtiquetas.tareaId, tarea.id)),
    db
      .select({
        titulo: tareas.titulo,
        descripcion: tareas.descripcion,
        prioridad: tareas.prioridad,
      })
      .from(tareas)
      .where(eq(tareas.parentId, tarea.id))
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
        proyectoId: tarea.proyectoId,
        estadoId: inicial.id,
        parentId: nueva.id,
        titulo: subtarea.titulo,
        descripcion: subtarea.descripcion,
        prioridad: subtarea.prioridad,
        posicion: (indice + 1) * 1024,
      })),
    );
  }

  return nueva.id;
}

export async function aplicarCambioEstado(
  tarea: Tarea,
  estadoActual: EstadoProyecto,
  destino: EstadoProyecto,
  posicion?: number,
) {
  const ahoraCompletada = destino.categoria === "completado";
  const estabaCompletada = estadoActual.categoria === "completado";

  await db
    .update(tareas)
    .set({
      estadoId: destino.id,
      ...(posicion !== undefined ? { posicion } : {}),
      ...(ahoraCompletada && !estabaCompletada
        ? { completadaEn: sql`(datetime('now'))` }
        : {}),
      ...(!ahoraCompletada && estabaCompletada ? { completadaEn: null } : {}),
      actualizadaEn: sql`(datetime('now'))`,
    })
    .where(eq(tareas.id, tarea.id));

  if (ahoraCompletada && !estabaCompletada && !tarea.parentId) {
    await crearSiguienteOcurrencia(tarea);
  }
}
