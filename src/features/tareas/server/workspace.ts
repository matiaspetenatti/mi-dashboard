import "@tanstack/react-start/server-only"

import { asc, eq, isNull } from "drizzle-orm"

import { fechaHoy } from "@/lib/dates"
import { getDb } from "@/server/db/client"
import {
  estadosProyecto,
  etiquetas,
  proyectos,
  tareas,
  tareasEtiquetas,
  type EstadoProyecto,
  type Proyecto,
} from "@/server/db/schema"
import type {
  ResumenProyecto,
  TareaBase,
  TareaConDetalle,
  WorkspaceTareas,
} from "../types"

export async function cargarTareas(): Promise<TareaConDetalle[]> {
  const db = getDb()

  const [filas, relaciones] = await Promise.all([
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
      .where(isNull(tareas.archivadaEn))
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
        proyectoId: etiquetas.proyectoId,
      })
      .from(tareasEtiquetas)
      .innerJoin(etiquetas, eq(tareasEtiquetas.etiquetaId, etiquetas.id))
      .orderBy(asc(etiquetas.nombre)),
  ])

  const etiquetasPorTarea = new Map<number, TareaBase["etiquetas"]>()
  for (const relacion of relaciones) {
    const lista = etiquetasPorTarea.get(relacion.tareaId) ?? []
    lista.push({
      id: relacion.id,
      nombre: relacion.nombre,
      color: relacion.color,
      icono: relacion.icono,
      proyectoId: relacion.proyectoId,
    })
    etiquetasPorTarea.set(relacion.tareaId, lista)
  }

  const bases: TareaBase[] = filas.map(({ tarea, estado, proyecto }) => ({
    ...tarea,
    estado,
    proyecto,
    etiquetas: etiquetasPorTarea.get(tarea.id) ?? [],
  }))

  const subtareasPorPadre = new Map<number, TareaBase[]>()
  const principales: TareaBase[] = []

  for (const tarea of bases) {
    if (tarea.parentId) {
      const lista = subtareasPorPadre.get(tarea.parentId) ?? []
      lista.push(tarea)
      subtareasPorPadre.set(tarea.parentId, lista)
    } else {
      principales.push(tarea)
    }
  }

  const ordenar = (items: TareaBase[]) =>
    [...items].sort(
      (a, b) =>
        a.estado.posicion - b.estado.posicion ||
        a.posicion - b.posicion ||
        a.id - b.id,
    )

  return ordenar(principales).map((tarea) => {
    const subtareas = [...(subtareasPorPadre.get(tarea.id) ?? [])].sort(
      (a, b) => a.posicion - b.posicion || a.id - b.id,
    )
    return {
      ...tarea,
      subtareas,
      subtareasCompletadas: subtareas.filter(
        (subtarea) => subtarea.estado.categoria === "completado",
      ).length,
    }
  })
}

function construirResumenes(
  listaProyectos: Proyecto[],
  listaEstados: EstadoProyecto[],
  todasLasTareas: TareaConDetalle[],
): ResumenProyecto[] {
  const hoy = fechaHoy()
  const estadosPorProyecto = new Map<number, EstadoProyecto[]>()

  for (const estado of listaEstados) {
    const lista = estadosPorProyecto.get(estado.proyectoId) ?? []
    lista.push(estado)
    estadosPorProyecto.set(estado.proyectoId, lista)
  }

  return listaProyectos.map((proyecto) => {
    const tareasProyecto = todasLasTareas.filter(
      (tarea) => tarea.proyectoId === proyecto.id,
    )
    const completadas = tareasProyecto.filter(
      (tarea) => tarea.estado.categoria === "completado",
    ).length
    const pendientes = tareasProyecto.filter(
      (tarea) =>
        tarea.estado.categoria !== "completado" &&
        tarea.estado.categoria !== "cancelado",
    ).length
    const vencidas = tareasProyecto.filter(
      (tarea) =>
        tarea.estado.categoria !== "completado" &&
        tarea.estado.categoria !== "cancelado" &&
        tarea.fechaLimite !== null &&
        tarea.fechaLimite < hoy,
    ).length

    return {
      proyecto,
      estados: estadosPorProyecto.get(proyecto.id) ?? [],
      total: tareasProyecto.length,
      completadas,
      pendientes,
      vencidas,
      progreso:
        tareasProyecto.length === 0
          ? 0
          : Math.round((completadas / tareasProyecto.length) * 100),
    }
  })
}

export async function obtenerWorkspaceTareas(): Promise<WorkspaceTareas> {
  const db = getDb()

  const [listaProyectos, listaEstados, listaEtiquetas, todasLasTareas] =
    await Promise.all([
      db
        .select()
        .from(proyectos)
        .orderBy(asc(proyectos.archivado), asc(proyectos.posicion), asc(proyectos.id)),
      db
        .select()
        .from(estadosProyecto)
        .orderBy(asc(estadosProyecto.posicion), asc(estadosProyecto.id)),
      db.select().from(etiquetas).orderBy(asc(etiquetas.nombre)),
      cargarTareas(),
    ])

  return {
    proyectos: construirResumenes(listaProyectos, listaEstados, todasLasTareas),
    estados: listaEstados,
    etiquetas: listaEtiquetas,
    tareas: todasLasTareas,
  }
}
