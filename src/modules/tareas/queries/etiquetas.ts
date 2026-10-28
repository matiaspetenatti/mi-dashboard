import { cacheLife, cacheTag } from "next/cache";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { etiquetas, tareasEtiquetas } from "@/modules/tareas/schema";

export async function getEtiquetas() {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");

  return db.select().from(etiquetas).orderBy(asc(etiquetas.nombre));
}

export async function getEtiquetasConUso() {
  "use cache";
  cacheTag("tareas");
  cacheLife("hours");

  return db
    .select({
      id: etiquetas.id,
      nombre: etiquetas.nombre,
      color: etiquetas.color,
      icono: etiquetas.icono,
      usos: count(tareasEtiquetas.tareaId),
    })
    .from(etiquetas)
    .leftJoin(tareasEtiquetas, eq(tareasEtiquetas.etiquetaId, etiquetas.id))
    .groupBy(etiquetas.id)
    .orderBy(asc(etiquetas.nombre));
}
