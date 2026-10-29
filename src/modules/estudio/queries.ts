import { connection } from "next/server";
import { and, asc, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { fechaHoy } from "@/lib/format";
import {
  carreras,
  examenes,
  materias,
  sesionesEstudio,
  type Carrera,
  type EstadoCarrera,
  type EstadoExamen,
  type EstadoMateria,
  type Materia,
  type ResultadoExamen,
  type SesionEstudio,
  type TipoExamen,
} from "./schema";

export type ExamenConContexto = {
  id: number;
  tipo: TipoExamen;
  titulo: string | null;
  fecha: string;
  nota: number | null;
  resultado: ResultadoExamen | null;
  estado: EstadoExamen;
  observaciones: string | null;
  materiaId: number;
  materia: string;
  carreraId: number;
  carrera: string;
};

export type ResumenMaterias = {
  total: number;
  aprobadas: number;
  regulares: number;
  cursando: number;
  pendientes: number;
  libres: number;
  totalPlan: number;
  progreso: number;
  promedio: number | null;
};

export type ResumenCarrera = ResumenMaterias & {
  carrera: Carrera;
  proximoExamen: ExamenConContexto | null;
};

export type ResumenEstudio = {
  totalCarreras: number;
  carrerasActivas: number;
  totalMaterias: number;
  aprobadas: number;
  totalPlan: number;
  progreso: number;
  promedio: number | null;
  proximosExamenes: number;
};

export type EstudioData = {
  hoy: string;
  carreras: ResumenCarrera[];
  proximosExamenes: ExamenConContexto[];
  resumen: ResumenEstudio;
};

export type DetalleCarreraData = {
  hoy: string;
  carrera: Carrera;
  materias: Materia[];
  examenes: ExamenConContexto[];
  resumen: ResumenMaterias;
};

export type WidgetEstudioData = {
  hoy: string;
  resumen: ResumenEstudio;
  proximo: ExamenConContexto | null;
};

const camposExamen = {
  id: examenes.id,
  tipo: examenes.tipo,
  titulo: examenes.titulo,
  fecha: examenes.fecha,
  nota: examenes.nota,
  resultado: examenes.resultado,
  estado: examenes.estado,
  observaciones: examenes.observaciones,
  materiaId: materias.id,
  materia: materias.nombre,
  carreraId: carreras.id,
  carrera: carreras.nombre,
};

const ordenEstadoCarrera: Record<EstadoCarrera, number> = {
  cursando: 0,
  pausada: 1,
  graduada: 2,
  abandonada: 3,
};

function contarEstado(lista: Materia[], estado: EstadoMateria) {
  return lista.filter((materia) => materia.estado === estado).length;
}

function calcularPromedio(lista: Materia[]) {
  const notas = lista
    .filter(
      (materia) =>
        materia.estado === "aprobada" && materia.notaFinal !== null,
    )
    .map((materia) => materia.notaFinal as number);

  if (notas.length === 0) return null;
  const promedio = notas.reduce((total, nota) => total + nota, 0) / notas.length;
  return Math.round(promedio * 100) / 100;
}

export function calcularResumenMaterias(
  carrera: Carrera,
  lista: Materia[],
): ResumenMaterias {
  const total = lista.length;
  const aprobadas = contarEstado(lista, "aprobada");
  const totalPlan = Math.max(total, carrera.materiasTotales ?? 0);
  const progreso =
    totalPlan > 0
      ? Math.min(100, Math.max(0, Math.round((aprobadas / totalPlan) * 100)))
      : 0;

  return {
    total,
    aprobadas,
    regulares: contarEstado(lista, "regular"),
    cursando: contarEstado(lista, "cursando"),
    pendientes: contarEstado(lista, "pendiente"),
    libres: contarEstado(lista, "libre"),
    totalPlan,
    progreso,
    promedio: calcularPromedio(lista),
  };
}

function calcularResumenGlobal(
  listaCarreras: Carrera[],
  listaMaterias: Materia[],
  proximosExamenes: number,
): ResumenEstudio {
  const activas = listaCarreras.filter(
    (carrera) => carrera.estado === "cursando",
  ).length;
  const aprobadas = contarEstado(listaMaterias, "aprobada");

  const totalPlan = listaCarreras.reduce((total, carrera) => {
    const materiasCarrera = listaMaterias.filter(
      (materia) => materia.carreraId === carrera.id,
    ).length;
    return total + Math.max(materiasCarrera, carrera.materiasTotales ?? 0);
  }, 0);

  const progreso =
    totalPlan > 0
      ? Math.min(100, Math.max(0, Math.round((aprobadas / totalPlan) * 100)))
      : 0;

  return {
    totalCarreras: listaCarreras.length,
    carrerasActivas: activas,
    totalMaterias: listaMaterias.length,
    aprobadas,
    totalPlan,
    progreso,
    promedio: calcularPromedio(listaMaterias),
    proximosExamenes,
  };
}

function ordenarExamenes(lista: ExamenConContexto[], hoy: string) {
  const futuros = lista
    .filter(
      (examen) => examen.estado === "programado" && examen.fecha >= hoy,
    )
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id);

  const pasados = lista
    .filter(
      (examen) => !(examen.estado === "programado" && examen.fecha >= hoy),
    )
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);

  return [...futuros, ...pasados];
}

export async function getEstudioData(): Promise<EstudioData> {
  await connection();
  const hoy = fechaHoy();

  const [listaCarreras, listaMaterias, listaExamenes] = await Promise.all([
    db.select().from(carreras),
    db.select().from(materias),
    db
      .select(camposExamen)
      .from(examenes)
      .innerJoin(materias, eq(examenes.materiaId, materias.id))
      .innerJoin(carreras, eq(materias.carreraId, carreras.id))
      .orderBy(asc(examenes.fecha)),
  ]);

  const materiasPorCarrera = new Map<number, Materia[]>();
  for (const materia of listaMaterias) {
    const actuales = materiasPorCarrera.get(materia.carreraId) ?? [];
    actuales.push(materia);
    materiasPorCarrera.set(materia.carreraId, actuales);
  }

  const carrerasOrdenadas = [...listaCarreras].sort(
    (a, b) =>
      ordenEstadoCarrera[a.estado] - ordenEstadoCarrera[b.estado] ||
      a.nombre.localeCompare(b.nombre),
  );

  const proximosExamenes = listaExamenes
    .filter(
      (examen) => examen.estado === "programado" && examen.fecha >= hoy,
    )
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id);

  const resumenes: ResumenCarrera[] = carrerasOrdenadas.map((carrera) => {
    const materiasCarrera = materiasPorCarrera.get(carrera.id) ?? [];
    return {
      carrera,
      ...calcularResumenMaterias(carrera, materiasCarrera),
      proximoExamen:
        proximosExamenes.find((examen) => examen.carreraId === carrera.id) ??
        null,
    };
  });

  return {
    hoy,
    carreras: resumenes,
    proximosExamenes,
    resumen: calcularResumenGlobal(
      listaCarreras,
      listaMaterias,
      proximosExamenes.length,
    ),
  };
}

export async function getCarreraDetalle(
  id: number,
): Promise<DetalleCarreraData | null> {
  await connection();

  const [carrera] = await db
    .select()
    .from(carreras)
    .where(eq(carreras.id, id))
    .limit(1);
  if (!carrera) return null;

  const hoy = fechaHoy();
  const [listaMaterias, listaExamenes] = await Promise.all([
    db
      .select()
      .from(materias)
      .where(eq(materias.carreraId, id))
      .orderBy(asc(materias.anio), asc(materias.nombre)),
    db
      .select(camposExamen)
      .from(examenes)
      .innerJoin(materias, eq(examenes.materiaId, materias.id))
      .innerJoin(carreras, eq(materias.carreraId, carreras.id))
      .where(eq(materias.carreraId, id))
      .orderBy(asc(examenes.fecha)),
  ]);

  return {
    hoy,
    carrera,
    materias: listaMaterias,
    examenes: ordenarExamenes(listaExamenes, hoy),
    resumen: calcularResumenMaterias(carrera, listaMaterias),
  };
}

export async function getWidgetEstudio(): Promise<WidgetEstudioData> {
  await connection();
  const hoy = fechaHoy();

  const [listaCarreras, listaMaterias, proximo] = await Promise.all([
    db.select().from(carreras),
    db.select().from(materias),
    db
      .select(camposExamen)
      .from(examenes)
      .innerJoin(materias, eq(examenes.materiaId, materias.id))
      .innerJoin(carreras, eq(materias.carreraId, carreras.id))
      .where(
        and(
          eq(examenes.estado, "programado"),
          gte(examenes.fecha, hoy),
        ),
      )
      .orderBy(asc(examenes.fecha))
      .limit(1),
  ]);

  return {
    hoy,
    resumen: calcularResumenGlobal(listaCarreras, listaMaterias, proximo.length),
    proximo: proximo[0] ?? null,
  };
}

export async function getMateriasPorCarrera(
  carreraId: number,
): Promise<Materia[]> {
  await connection();
  return db
    .select()
    .from(materias)
    .where(eq(materias.carreraId, carreraId))
    .orderBy(asc(materias.nombre));
}

export async function getSesionesEstudio(): Promise<SesionEstudio[]> {
  await connection();
  return db
    .select()
    .from(sesionesEstudio)
    .orderBy(desc(sesionesEstudio.fecha), desc(sesionesEstudio.creadaEn));
}
