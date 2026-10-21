"use server";

import { db } from "@/db";
import { tareas, tags, tareasTags } from "./schema";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fechaHoy, sumarFecha } from "@/lib/format";

import {
  colorPorDefecto,
  columnaDe,
  unidadesRecurrencia,
  type Columna,
  type UnidadRecurrencia,
} from "./constantes";

function refrescar() {
  updateTag("tareas"); // expira la caché y la próxima lectura ya trae datos frescos
  revalidatePath("/tareas", "layout"); // refresca también la caché del navegador
  revalidatePath("/");
}

// "Casa, #trabajo" -> ["casa", "trabajo"]
function parseTags(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  const limpios = raw
    .split(",")
    .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
    .filter((t) => t.length > 0 && t.length <= 30);
  return [...new Set(limpios)].slice(0, 10);
}

async function asignarTags(tareaId: number, nombres: string[]) {
  if (nombres.length === 0) return;
  await db
    .insert(tags)
    .values(
      nombres.map((nombre) => ({ nombre, color: colorPorDefecto(nombre) })),
    )
    .onConflictDoNothing();
  const filas = await db
    .select({ id: tags.id })
    .from(tags)
    .where(inArray(tags.nombre, nombres));
  await db
    .insert(tareasTags)
    .values(filas.map((f) => ({ tareaId, tagId: f.id })))
    .onConflictDoNothing();
}

const camposSchema = z.object({
  titulo: z.string().trim().min(1, "Escribí un título").max(200),
  fechaLimite: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  grupoId: z.coerce.number().int().positive().optional(),
  recurrencia: z.enum(unidadesRecurrencia).optional(),
  recurrenciaCada: z.coerce.number().int().min(1).max(365).default(1),
});

function leerCampos(formData: FormData) {
  return camposSchema.safeParse({
    titulo: formData.get("titulo"),
    fechaLimite: formData.get("fechaLimite") || undefined,
    grupoId: formData.get("grupoId") || undefined,
    recurrencia: formData.get("recurrenciaUnidad") || undefined,
    recurrenciaCada: formData.get("recurrenciaCada") || undefined,
  });
}

export async function crearTarea(formData: FormData) {
  const parsed = leerCampos(formData);
  if (!parsed.success) return;

  const { titulo, grupoId, recurrencia, recurrenciaCada } = parsed.data;
  // una tarea repetitiva necesita fecha base: si no la puso, arranca hoy
  const fechaLimite =
    parsed.data.fechaLimite ?? (recurrencia ? fechaHoy() : undefined);

  const [nueva] = await db
    .insert(tareas)
    .values({
      titulo,
      fechaLimite,
      grupoId,
      recurrencia,
      recurrenciaCada: recurrencia ? recurrenciaCada : 1,
    })
    .returning({ id: tareas.id });
  await asignarTags(nueva.id, parseTags(formData.get("tags")));
  refrescar();
}

const estadoSchema = z.enum(["pendiente", "en_curso", "hecha"]);

export async function actualizarTarea(id: number, formData: FormData) {
  const parsed = leerCampos(formData);
  const estado = estadoSchema.safeParse(formData.get("estado"));
  if (!parsed.success || !estado.success) return;

  const { titulo, grupoId, recurrencia, recurrenciaCada } = parsed.data;
  const fechaLimite =
    parsed.data.fechaLimite ?? (recurrencia ? fechaHoy() : null);

  await db
    .update(tareas)
    .set({
      titulo,
      fechaLimite,
      grupoId: grupoId ?? null,
      recurrencia: recurrencia ?? null,
      recurrenciaCada: recurrencia ? recurrenciaCada : 1,
    })
    .where(eq(tareas.id, id));

  // reemplaza los tags por los del formulario
  await db.delete(tareasTags).where(eq(tareasTags.tareaId, id));
  await asignarTags(id, parseTags(formData.get("tags")));

  await cambiarEstado(id, estado.data);
  refrescar();
  redirect("/tareas");
}

export async function crearSubtarea(parentId: number, formData: FormData) {
  const parsed = z
    .string()
    .trim()
    .min(1)
    .max(200)
    .safeParse(formData.get("titulo"));
  if (!parsed.success) return;
  await db.insert(tareas).values({ titulo: parsed.data, parentId });
  refrescar();
}

// Al completar una tarea repetitiva, crea la próxima ocurrencia
async function crearSiguienteOcurrencia(
  original: typeof tareas.$inferSelect,
  unidad: UnidadRecurrencia,
) {
  const hoy = fechaHoy();
  const cada = original.recurrenciaCada;
  let siguiente = sumarFecha(original.fechaLimite ?? hoy, unidad, cada);
  // si la completaste tarde, salta hasta una fecha futura
  for (let i = 0; siguiente <= hoy && i < 1000; i++) {
    siguiente = sumarFecha(siguiente, unidad, cada);
  }

  const [nueva] = await db
    .insert(tareas)
    .values({
      titulo: original.titulo,
      fechaLimite: siguiente,
      grupoId: original.grupoId,
      recurrencia: unidad,
      recurrenciaCada: cada,
    })
    .returning({ id: tareas.id });

  const [subs, etiquetas] = await Promise.all([
    db
      .select({ titulo: tareas.titulo })
      .from(tareas)
      .where(eq(tareas.parentId, original.id)),
    db
      .select({ tagId: tareasTags.tagId })
      .from(tareasTags)
      .where(eq(tareasTags.tareaId, original.id)),
  ]);
  if (subs.length > 0) {
    await db
      .insert(tareas)
      .values(subs.map((s) => ({ titulo: s.titulo, parentId: nueva.id })));
  }
  if (etiquetas.length > 0) {
    await db
      .insert(tareasTags)
      .values(etiquetas.map((e) => ({ tareaId: nueva.id, tagId: e.tagId })));
  }
}

// cambia la tarea de columna; si pasa a "hecha" y es repetitiva, crea la siguiente
async function cambiarEstado(id: number, destino: Columna) {
  const [tarea] = await db.select().from(tareas).where(eq(tareas.id, id));
  if (!tarea || columnaDe(tarea) === destino) return;

  await db
    .update(tareas)
    .set({ completada: destino === "hecha", enCurso: destino === "en_curso" })
    .where(eq(tareas.id, id));

  if (destino === "hecha" && tarea.recurrencia && !tarea.parentId) {
    await crearSiguienteOcurrencia(tarea, tarea.recurrencia);
  }
}

export async function alternarTarea(id: number) {
  const [tarea] = await db.select().from(tareas).where(eq(tareas.id, id));
  if (!tarea) return;
  await cambiarEstado(id, tarea.completada ? "pendiente" : "hecha");
  refrescar();
}

export async function moverTarea(id: number, columna: Columna) {
  const parsed = estadoSchema.safeParse(columna);
  if (!parsed.success) return;
  await cambiarEstado(id, parsed.data);
  refrescar();
}

export async function borrarTarea(id: number) {
  // primero tags y subtareas, para no dejar filas huérfanas
  const subs = await db
    .select({ id: tareas.id })
    .from(tareas)
    .where(eq(tareas.parentId, id));
  const ids = [id, ...subs.map((s) => s.id)];
  await db.batch([
    db.delete(tareasTags).where(inArray(tareasTags.tareaId, ids)),
    db.delete(tareas).where(eq(tareas.parentId, id)),
    db.delete(tareas).where(eq(tareas.id, id)),
  ]);
  refrescar();
}

export async function agregarTags(tareaId: number, formData: FormData) {
  await asignarTags(tareaId, parseTags(formData.get("tags")));
  refrescar();
}

export async function quitarTag(tareaId: number, nombre: string) {
  const [tag] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(eq(tags.nombre, nombre));
  if (!tag) return;
  await db
    .delete(tareasTags)
    .where(and(eq(tareasTags.tareaId, tareaId), eq(tareasTags.tagId, tag.id)));
  refrescar();
}
