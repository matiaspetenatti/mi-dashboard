"use server";

import { requireAuthorizedUser } from "@/lib/auth";
import { db } from "@/db";
import { proyectos, tareas, estadosProyecto } from "@/modules/tareas/schema";
import { eq } from "drizzle-orm";
import { crearTarea } from "@/modules/tareas/actions/tareas";
import { refrescarTareas } from "@/modules/tareas/lib/refrescar";
import { errorAccion, type ResultadoAccion } from "@/modules/tareas/lib/resultado";

export async function exportarTareasCSV(): Promise<string> {
  await requireAuthorizedUser();
  const filas = await db
    .select({
      id: tareas.id,
      titulo: tareas.titulo,
      proyecto: proyectos.nombre,
      prioridad: tareas.prioridad,
      fechaLimite: tareas.fechaLimite,
      estado: estadosProyecto.nombre,
    })
    .from(tareas)
    .innerJoin(proyectos, eq(tareas.proyectoId, proyectos.id))
    .innerJoin(estadosProyecto, eq(tareas.estadoId, estadosProyecto.id));

  const encabezado = "id,titulo,proyecto,prioridad,fechaLimite,estado";
  const lineas = filas.map((f) =>
    [f.id, csv(f.titulo), csv(f.proyecto), f.prioridad ?? "", f.fechaLimite ?? "", csv(f.estado)].join(","),
  );
  return [encabezado, ...lineas].join("\n");
}

function csv(valor: string) {
  if (/[",\n]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`;
  return valor;
}

export async function importarTareasCSV(
  contenido: string,
): Promise<ResultadoAccion<{ creadas: number; errores: string[] }>> {
  await requireAuthorizedUser();
  const lineas = contenido.split(/\r?\n/).filter((l) => l.trim());
  if (lineas.length < 2) return errorAccion("Archivo vacío");
  const errores: string[] = [];
  let creadas = 0;
  // mapa de proyectos por nombre
  const listaProyectos = await db.select().from(proyectos);
  const proyectoPorNombre = new Map(listaProyectos.map((p) => [p.nombre.toLowerCase(), p.id]));

  for (let i = 1; i < lineas.length; i++) {
    const campos = parseCsvLine(lineas[i]);
    const titulo = campos[0]?.trim();
    const nombreProyecto = (campos[1] ?? "").trim();
    const prioridad = (campos[2] ?? "").trim() || null;
    const fechaLimite = (campos[3] ?? "").trim() || null;
    if (!titulo) {
      errores.push(`Línea ${i + 1}: título vacío`);
      continue;
    }
    let proyectoId = proyectoPorNombre.get(nombreProyecto.toLowerCase());
    if (!proyectoId) {
      // crear proyecto
      const [nuevo] = await db
        .insert(proyectos)
        .values({
          nombre: nombreProyecto || "Importado",
          slug: `importado-${Date.now()}-${i}`,
          color: "#737373",
          prefijo: "IMP",
        })
        .returning({ id: proyectos.id });
      proyectoId = nuevo.id;
      // estados por defecto
      await db.insert(estadosProyecto).values([
        { proyectoId, nombre: "Por hacer", color: "#737373", categoria: "pendiente", posicion: 0 },
        { proyectoId, nombre: "Hecho", color: "#22c55e", categoria: "completado", posicion: 1 },
      ]);
      proyectoPorNombre.set((nombreProyecto || "Importado").toLowerCase(), proyectoId);
    }
    const estados = await db
      .select()
      .from(estadosProyecto)
      .where(eq(estadosProyecto.proyectoId, proyectoId));
    const estadoId = estados[0]?.id;
    if (!estadoId) {
      errores.push(`Línea ${i + 1}: sin estado`);
      continue;
    }
    const r = await crearTarea({
      proyectoId,
      estadoId,
      titulo,
      prioridad: prioridad as never,
      fechaLimite,
    });
    if (r.ok) creadas += 1;
    else errores.push(`Línea ${i + 1}: ${r.error}`);
  }
  refrescarTareas();
  return { ok: true, creadas, errores };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        result.push(cur);
        cur = "";
      } else cur += ch;
    }
  }
  result.push(cur);
  return result;
}