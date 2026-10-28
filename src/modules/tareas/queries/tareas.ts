import { cacheLife, cacheTag } from "next/cache";
import { and, asc, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  estadosProyecto,
  etiquetas,
  proyectos,
  tareas,
  tareasEtiquetas,
  type EstadoProyecto,
  type Etiqueta,
  type Proyecto,
  type Tarea,
} from "@/modules/tareas/schema";
import { fechaHoy } from "@/lib/format";
import { cuentaComoPendiente } from "@/modules/tareas/lib/orden";

export type ProyectoDeTarea = Pick<
  Proyecto,
  "id" | "nombre" | "color" | "prefijo"
>;

export type EstadoDeTarea = Pick<
  EstadoProyecto,
  "id" | "nombre" | "color" | "categoria" | "posicion"
>;

export type TareaBase = Tarea & {
  estado: EstadoDeTarea;
  proyecto: ProyectoDeTarea;
  etiquetas: Etiqueta[];
};

export type TareaConDetalle = TareaBase & {
  subtareas: TareaBase[];
  subtareasCompletadas: number;
};

type FilaTarea = {
  tarea: Tarea;
  estado: EstadoDeTarea;
  proyecto: ProyectoDeTarea;
};

async function cargarTareas(proyectoId?: number) {
  const [filas, relaciones] = await db.batch([
    db
      .select({
        tarea: tareas,
        estado: {
          id: estadosProyecto.id,
          nombre: estadosProyecto.nombre,
          color: estadosProyecto.color,
          categoria: estadosProyecto.categoria,
          posicion: estadosProyecto.posicion,
        },
        proyecto: {
          id: proyectos.id,
          nombre: proyectos.nombre,
          color: proyectos.color,
          prefijo: proyectos.prefijo,
        },
      })
      .from(tareas)
      .innerJoin(estadosProyecto, eq(tareas.estadoId, estadosProyecto.id))
      .innerJoin(proyectos, eq(tareas.proyectoId, proyectos.id))
      .where(proyectoId ? eq(tareas.proyectoId, proyectoId) : undefined)
      .orderBy(
        asc(estadosProyecto.posicion),
        asc(tareas.posicion),
        asc(tareas.id),
      ),
    db
      .select({
        tareaId: tareasEtiquetas.tareaId,
        id: etiquetas.id,
        nombre: etiquetas.nombre,
        color: etiquetas.color,
        icono: etiquetas.icono,
      })
      .from(tareasEtiquetas)
      .innerJoin(etiquetas, eq(tareasEtiquetas.etiquetaId, etiquetas.id))
      .orderBy(asc(etiquetas.nombre)),
  ]);

  const etiquetasPorTarea = new Map<number, Etiqueta[]>();
  for (const { tareaId, ...etiqueta } of relaciones) {
    etiquetasPorTarea.set(tareaId, [
      ...(etiquetasPorTarea.get(tareaId) ?? []),
      etiqueta,
    ]);
  }

  const bases: TareaBase[] = filas.map(({ tarea, estado, proyecto }: FilaTarea) => ({
    ...tarea,
    estado,
    proyecto,
    etiquetas: etiquetasPorTarea.get(tarea.id) ?? [],
  }));

  const subtareasPorPadre = new Map<number, TareaBase[]>();
  const principales: TareaBase[] = [];
  for (const tarea of bases) {
    if (tarea.parentId) {
      subtareasPorPadre.set(tarea.parentId, [
        ...(subtareasPorPadre.get(tarea.parentId) ?? []),
        tarea,
      ]);
    } else {
      principales.push(tarea);
    }
  }

  const ordenar = (items: TareaBase[]) =>
    [...items].sort(
      (a, b) =>
        a.estado.posicion - b.estado.posicion ||
        a.posicion - b.posicion ||
        a.id - b.id,
    );

  return ordenar(principales).map((tarea) => {
    const subtareas = (subtareasPorPadre.get(tarea.id) ?? []).sort(
      (a, b) => a.posicion - b.posicion || a.id - b.id,
    );
    return {
      ...tarea,
      subtareas,
      subtareasCompletadas: subtareas.filter(
        (subtarea) => subtarea.estado.categoria === "completado",
      ).length,
    };
  });
}

export async function getTareasProyecto(proyectoId: number) {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");

  return cargarTareas(proyectoId);
}

export async function getTareasGlobales() {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");

  return cargarTareas();
}

export type ResumenGlobal = {
  pendientes: number;
  hoy: number;
  proximas: number;
  vencidas: number;
  sinFecha: number;
  completadas: number;
  total: number;
};

export async function getResumenGlobal(): Promise<ResumenGlobal> {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");

  const tareasGlobales = await cargarTareas();
  const hoy = fechaHoy();
  const limiteSemana = new Date(
    Date.parse(`${hoy}T00:00:00Z`) + 7 * 86_400_000,
  )
    .toISOString()
    .slice(0, 10);

  const resumen: ResumenGlobal = {
    pendientes: 0,
    hoy: 0,
    proximas: 0,
    vencidas: 0,
    sinFecha: 0,
    completadas: 0,
    total: tareasGlobales.length,
  };

  for (const tarea of tareasGlobales) {
    if (tarea.estado.categoria === "completado") {
      resumen.completadas += 1;
      continue;
    }
    if (tarea.estado.categoria === "cancelado") continue;

    resumen.pendientes += 1;
    if (!tarea.fechaLimite) {
      resumen.sinFecha += 1;
    } else if (tarea.fechaLimite < hoy) {
      resumen.vencidas += 1;
    } else if (tarea.fechaLimite === hoy) {
      resumen.hoy += 1;
    }
    if (tarea.fechaLimite && tarea.fechaLimite > hoy && tarea.fechaLimite <= limiteSemana) {
      resumen.proximas += 1;
    }
  }

  return resumen;
}

export async function getPendientesCount() {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");

  const [fila] = await db
    .select({ total: count() })
    .from(tareas)
    .innerJoin(estadosProyecto, eq(tareas.estadoId, estadosProyecto.id))
    .where(
      and(
        isNull(tareas.parentId),
        inArray(estadosProyecto.categoria, ["pendiente", "en_progreso"]),
      ),
    );

  return fila?.total ?? 0;
}

export async function getProximasTareas(limit = 3) {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");

  return db
    .select({
      id: tareas.id,
      titulo: tareas.titulo,
      fechaLimite: tareas.fechaLimite,
      prioridad: tareas.prioridad,
      proyectoNombre: proyectos.nombre,
      proyectoColor: proyectos.color,
      proyectoSlug: proyectos.slug,
      prefijo: proyectos.prefijo,
    })
    .from(tareas)
    .innerJoin(estadosProyecto, eq(tareas.estadoId, estadosProyecto.id))
    .innerJoin(proyectos, eq(tareas.proyectoId, proyectos.id))
    .where(
      and(
        isNull(tareas.parentId),
        inArray(estadosProyecto.categoria, ["pendiente", "en_progreso"]),
      ),
    )
    .orderBy(
      sql`${tareas.fechaLimite} is null`,
      asc(tareas.fechaLimite),
      desc(tareas.id),
    )
    .limit(limit);
}

export async function getConteoPendientePorProyecto() {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");

  return db
    .select({
      proyectoId: tareas.proyectoId,
      total: count(),
    })
    .from(tareas)
    .innerJoin(estadosProyecto, eq(tareas.estadoId, estadosProyecto.id))
    .where(
      and(
        isNull(tareas.parentId),
        inArray(estadosProyecto.categoria, ["pendiente", "en_progreso"]),
      ),
    )
    .groupBy(tareas.proyectoId);
}

export function esPendiente(tarea: TareaConDetalle) {
  return cuentaComoPendiente(tarea.estado);
}
