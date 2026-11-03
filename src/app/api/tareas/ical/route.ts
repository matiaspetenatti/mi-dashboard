import { requireAuthorizedUser } from "@/lib/auth";
import { db } from "@/db";
import { tareas, proyectos } from "@/modules/tareas/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  await requireAuthorizedUser();
  const filas = await db
    .select({
      id: tareas.id,
      titulo: tareas.titulo,
      descripcion: tareas.descripcion,
      fechaLimite: tareas.fechaLimite,
      fechaInicio: tareas.fechaInicio,
      proyecto: proyectos.nombre,
    })
    .from(tareas)
    .innerJoin(proyectos, eq(tareas.proyectoId, proyectos.id));

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//mi-dashboard//Tareas//ES",
  ];
  for (const t of filas) {
    if (!t.fechaLimite) continue;
    const dt = t.fechaLimite.replace(/-/g, "");
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:tarea-${t.id}@mi-dashboard`);
    lines.push(`DTSTART;VALUE=DATE:${dt}`);
    lines.push(`DTEND;VALUE=DATE:${dt}`);
    lines.push(`SUMMARY:${escapeIcs(t.titulo)}`);
    if (t.descripcion) lines.push(`DESCRIPTION:${escapeIcs(t.descripcion)}`);
    lines.push(`CATEGORIES:${escapeIcs(t.proyecto)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tareas.ics"',
    },
  });
}

function escapeIcs(v: string) {
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}