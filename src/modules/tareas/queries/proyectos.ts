import { cacheLife, cacheTag } from "next/cache";
import { asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  estadosProyecto,
  proyectos,
  tareas,
  vistasProyecto,
  type EstadoProyecto,
  type Proyecto,
  type VistaProyecto,
} from "@/modules/tareas/schema";
import { fechaHoy } from "@/lib/format";
import {
  parseConfigVista,
  type ConfigVista,
} from "@/modules/tareas/lib/config-vista";
import { getTareasProyecto, type TareaConDetalle } from "./tareas";
import { getEtiquetas } from "./etiquetas";
import type { Etiqueta } from "@/modules/tareas/schema";

export type ResumenPorEstado = {
  estado: EstadoProyecto;
  total: number;
  completadas: number;
};

export type ResumenProyecto = {
  proyecto: Proyecto;
  estados: EstadoProyecto[];
  total: number;
  completadas: number;
  pendientes: number;
  vencidas: number;
  progreso: number;
  porEstado: ResumenPorEstado[];
};

export async function getProyectosConResumen(): Promise<ResumenProyecto[]> {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");

  const [listaProyectos, listaEstados, filas] = await Promise.all([
    db
      .select()
      .from(proyectos)
      .orderBy(asc(proyectos.archivado), asc(proyectos.posicion), asc(proyectos.id)),
    db
      .select()
      .from(estadosProyecto)
      .orderBy(asc(estadosProyecto.posicion), asc(estadosProyecto.id)),
    db
      .select({
        proyectoId: tareas.proyectoId,
        estadoId: tareas.estadoId,
        fechaLimite: tareas.fechaLimite,
      })
      .from(tareas)
      .where(isNull(tareas.parentId)),
  ]);

  const hoy = fechaHoy();
  const estadosPorId = new Map(listaEstados.map((estado) => [estado.id, estado]));
  const estadosPorProyecto = new Map<number, EstadoProyecto[]>();
  for (const estado of listaEstados) {
    estadosPorProyecto.set(estado.proyectoId, [
      ...(estadosPorProyecto.get(estado.proyectoId) ?? []),
      estado,
    ]);
  }

  const conteos = new Map<
    number,
    { total: number; completadas: number; pendientes: number; vencidas: number; porEstado: Map<number, ResumenPorEstado> }
  >();

  for (const proyecto of listaProyectos) {
    const porEstado = new Map<number, ResumenPorEstado>();
    for (const estado of estadosPorProyecto.get(proyecto.id) ?? []) {
      porEstado.set(estado.id, { estado, total: 0, completadas: 0 });
    }
    conteos.set(proyecto.id, {
      total: 0,
      completadas: 0,
      pendientes: 0,
      vencidas: 0,
      porEstado,
    });
  }

  for (const fila of filas) {
    const conteo = conteos.get(fila.proyectoId);
    const estado = estadosPorId.get(fila.estadoId);
    if (!conteo || !estado) continue;

    conteo.total += 1;
    const delEstado = conteo.porEstado.get(estado.id);
    if (delEstado) delEstado.total += 1;

    if (estado.categoria === "completado") {
      conteo.completadas += 1;
      if (delEstado) delEstado.completadas += 1;
      continue;
    }
    if (estado.categoria === "cancelado") continue;

    conteo.pendientes += 1;
    if (fila.fechaLimite && fila.fechaLimite < hoy) conteo.vencidas += 1;
  }

  return listaProyectos.map((proyecto) => {
    const conteo = conteos.get(proyecto.id)!;
    return {
      proyecto,
      estados: estadosPorProyecto.get(proyecto.id) ?? [],
      total: conteo.total,
      completadas: conteo.completadas,
      pendientes: conteo.pendientes,
      vencidas: conteo.vencidas,
      progreso:
        conteo.total === 0
          ? 0
          : Math.round((conteo.completadas / conteo.total) * 100),
      porEstado: [...conteo.porEstado.values()],
    };
  });
}

export type VistaConConfig = Omit<VistaProyecto, "config"> & {
  config: ConfigVista;
};

export type ProyectoWorkspace = {
  proyecto: Proyecto;
  estados: EstadoProyecto[];
  vistas: VistaConConfig[];
  tareas: TareaConDetalle[];
  etiquetas: Etiqueta[];
};

export async function getProyectoWorkspace(
  slug: string,
): Promise<ProyectoWorkspace | null> {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");

  const [proyecto] = await db
    .select()
    .from(proyectos)
    .where(eq(proyectos.slug, slug));

  if (!proyecto) return null;

  const [estados, vistas, tareasProyecto, etiquetas] = await Promise.all([
    db
      .select()
      .from(estadosProyecto)
      .where(eq(estadosProyecto.proyectoId, proyecto.id))
      .orderBy(asc(estadosProyecto.posicion), asc(estadosProyecto.id)),
    db
      .select()
      .from(vistasProyecto)
      .where(eq(vistasProyecto.proyectoId, proyecto.id))
      .orderBy(asc(vistasProyecto.posicion), asc(vistasProyecto.id)),
    getTareasProyecto(proyecto.id),
    getEtiquetas(),
  ]);

  return {
    proyecto,
    estados,
    vistas: vistas.map((vista) => ({
      ...vista,
      config: parseConfigVista(vista.config),
    })),
    tareas: tareasProyecto,
    etiquetas,
  };
}

export async function getProyectoPorSlug(slug: string) {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");

  const [proyecto] = await db
    .select()
    .from(proyectos)
    .where(eq(proyectos.slug, slug));
  return proyecto ?? null;
}
