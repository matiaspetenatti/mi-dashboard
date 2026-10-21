import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { tareas, tags, tareasTags, grupos } from "./schema";
import { and, asc, count, desc, eq, isNull, sql } from "drizzle-orm";
import type { TagData } from "./constantes";

export type Filtros = { tag?: string; grupo?: string };

export async function getTareas({ tag, grupo }: Filtros = {}) {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");

  const [filas, relaciones, listaGrupos] = await Promise.all([
    db.select().from(tareas).orderBy(asc(tareas.completada), desc(tareas.id)),
    db
      .select({
        tareaId: tareasTags.tareaId,
        nombre: tags.nombre,
        color: tags.color,
        icono: tags.icono,
      })
      .from(tareasTags)
      .innerJoin(tags, eq(tareasTags.tagId, tags.id))
      .orderBy(asc(tags.nombre)),
    db.select().from(grupos),
  ]);

  const tagsPorTarea = new Map<number, TagData[]>();
  for (const { tareaId, ...datos } of relaciones) {
    tagsPorTarea.set(tareaId, [...(tagsPorTarea.get(tareaId) ?? []), datos]);
  }
  const grupoPorId = new Map(listaGrupos.map((g) => [g.id, g]));

  const conDetalle = filas.map((t) => ({
    ...t,
    tags: tagsPorTarea.get(t.id) ?? [],
    grupo: t.grupoId ? (grupoPorId.get(t.grupoId) ?? null) : null,
  }));

  const subtareasPorPadre = new Map<number, typeof conDetalle>();
  const principales: typeof conDetalle = [];
  for (const t of conDetalle) {
    if (t.parentId) {
      subtareasPorPadre.set(t.parentId, [
        ...(subtareasPorPadre.get(t.parentId) ?? []),
        t,
      ]);
    } else {
      principales.push(t);
    }
  }

  let resultado = principales.map((t) => ({
    ...t,
    subtareas: (subtareasPorPadre.get(t.id) ?? []).sort((a, b) => a.id - b.id),
  }));

  if (tag)
    resultado = resultado.filter((t) => t.tags.some((x) => x.nombre === tag));
  if (grupo === "sin") resultado = resultado.filter((t) => t.grupoId === null);
  else if (grupo)
    resultado = resultado.filter((t) => t.grupoId === Number(grupo));

  return resultado;
}

export type TareaConDetalle = Awaited<ReturnType<typeof getTareas>>[number];

// una sola tarea, para la pantalla de edición
export async function getTarea(id: number) {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");

  const [tarea] = await db.select().from(tareas).where(eq(tareas.id, id));
  if (!tarea) return null;
  const etiquetas = await db
    .select({ nombre: tags.nombre })
    .from(tareasTags)
    .innerJoin(tags, eq(tareasTags.tagId, tags.id))
    .where(eq(tareasTags.tareaId, id))
    .orderBy(asc(tags.nombre));
  return { ...tarea, tags: etiquetas.map((e) => e.nombre) };
}

export async function getGrupos() {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");

  return db.select().from(grupos).orderBy(asc(grupos.nombre));
}

// tags usados por alguna tarea, para la barra de filtros
export async function getTagsEnUso(): Promise<TagData[]> {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");

  return db
    .selectDistinct({
      nombre: tags.nombre,
      color: tags.color,
      icono: tags.icono,
    })
    .from(tags)
    .innerJoin(tareasTags, eq(tareasTags.tagId, tags.id))
    .orderBy(asc(tags.nombre));
}

// todos los tags (para la pantalla de gestión), con cuántas tareas los usan
export async function getTodosLosTags() {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");

  return db
    .select({
      id: tags.id,
      nombre: tags.nombre,
      color: tags.color,
      icono: tags.icono,
      usos: count(tareasTags.tareaId),
    })
    .from(tags)
    .leftJoin(tareasTags, eq(tareasTags.tagId, tags.id))
    .groupBy(tags.id)
    .orderBy(asc(tags.nombre));
}

// Las subtareas no cuentan como pendientes del hub
export async function getPendientesCount() {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");

  const [row] = await db
    .select({ total: count() })
    .from(tareas)
    .where(and(eq(tareas.completada, false), isNull(tareas.parentId)));
  return row.total;
}

// Pendientes: primero las que tienen fecha (la más cercana arriba), después el resto
export async function getProximasTareas(limit = 3) {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");

  return db
    .select()
    .from(tareas)
    .where(and(eq(tareas.completada, false), isNull(tareas.parentId)))
    .orderBy(
      sql`${tareas.fechaLimite} is null`,
      asc(tareas.fechaLimite),
      desc(tareas.id),
    )
    .limit(limit);
}
