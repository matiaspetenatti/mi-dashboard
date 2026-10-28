import { cacheLife, cacheTag } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { vistasProyecto } from "@/modules/tareas/schema";
import { parseConfigVista } from "@/modules/tareas/lib/config-vista";
import type { VistaConConfig } from "./proyectos";

export async function getVistasProyecto(
  proyectoId: number,
): Promise<VistaConConfig[]> {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");

  const vistas = await db
    .select()
    .from(vistasProyecto)
    .where(eq(vistasProyecto.proyectoId, proyectoId))
    .orderBy(asc(vistasProyecto.posicion), asc(vistasProyecto.id));

  return vistas.map((vista) => ({
    ...vista,
    config: parseConfigVista(vista.config),
  }));
}
