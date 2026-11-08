import "@tanstack/react-start/server-only"

import { and, asc, eq } from "drizzle-orm"

import { getDb } from "@/server/db/client"
import { estadosProyecto, proyectos, tareas } from "@/server/db/schema"

export async function crearTareaRapidaEnDb(input: {
  titulo: string
  fechaLimite?: string | null
  prioridad?: "urgente" | "alta" | "media" | "baja" | null
}): Promise<{ id: number }> {
  const db = getDb()

  let proyecto = (
    await db
      .select({ id: proyectos.id })
      .from(proyectos)
      .where(eq(proyectos.archivado, false))
      .orderBy(asc(proyectos.id))
      .limit(1)
  ).at(0)

  if (!proyecto) {
    const [nuevo] = await db
      .insert(proyectos)
      .values({
        nombre: "Inbox",
        slug: "inbox",
        descripcion: "Tareas rápidas sin proyecto",
        icono: "inbox",
        color: "#163300",
        prefijo: "INB",
      })
      .returning({ id: proyectos.id })
    proyecto = nuevo
  }

  let estado = (
    await db
      .select({ id: estadosProyecto.id })
      .from(estadosProyecto)
      .where(
        and(
          eq(estadosProyecto.proyectoId, proyecto.id),
          eq(estadosProyecto.categoria, "pendiente"),
        ),
      )
      .orderBy(asc(estadosProyecto.posicion))
      .limit(1)
  ).at(0)

  if (!estado) {
    const [nuevo] = await db
      .insert(estadosProyecto)
      .values({
        proyectoId: proyecto.id,
        nombre: "Por hacer",
        color: "#737373",
        categoria: "pendiente",
        posicion: 0,
      })
      .returning({ id: estadosProyecto.id })
    estado = nuevo
  }

  const [tarea] = await db
    .insert(tareas)
    .values({
      proyectoId: proyecto.id,
      estadoId: estado.id,
      titulo: input.titulo,
      fechaLimite: input.fechaLimite ?? null,
      prioridad: input.prioridad ?? null,
      posicion: 0,
    })
    .returning({ id: tareas.id })

  return { id: tarea.id }
}
