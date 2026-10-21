import { connection } from "next/server";
import { db } from "@/db";
import { examenes, materias } from "./schema";
import { asc, desc, eq, gte } from "drizzle-orm";
import { fechaHoy } from "@/lib/format";

const campos = {
  id: examenes.id,
  tipo: examenes.tipo,
  fecha: examenes.fecha,
  nota: examenes.nota,
  materia: materias.nombre,
};

export async function getEstudioData() {
  await connection();
  const [listaMaterias, listaExamenes] = await Promise.all([
    db.select().from(materias).orderBy(asc(materias.nombre)),
    db
      .select(campos)
      .from(examenes)
      .innerJoin(materias, eq(examenes.materiaId, materias.id))
      .orderBy(desc(examenes.fecha)),
  ]);
  return { materias: listaMaterias, examenes: listaExamenes, hoy: fechaHoy() };
}

export async function getProximoExamen() {
  await connection();
  const hoy = fechaHoy();
  const [row] = await db
    .select(campos)
    .from(examenes)
    .innerJoin(materias, eq(examenes.materiaId, materias.id))
    .where(gte(examenes.fecha, hoy))
    .orderBy(asc(examenes.fecha))
    .limit(1);
  return row ? { ...row, hoy } : null;
}
