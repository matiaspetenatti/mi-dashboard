export const unidadesRecurrencia = ["dia", "semana", "mes", "anio"] as const;
export type UnidadRecurrencia = (typeof unidadesRecurrencia)[number];

export function textoRecurrencia(unidad: UnidadRecurrencia, cada: number) {
  if (cada === 1) {
    return {
      dia: "Todos los días",
      semana: "Cada semana",
      mes: "Cada mes",
      anio: "Cada año",
    }[unidad];
  }
  const plural = { dia: "días", semana: "semanas", mes: "meses", anio: "años" }[
    unidad
  ];
  return `Cada ${cada} ${plural}`;
}

export const columnas = [
  { id: "pendiente", titulo: "Por hacer" },
  { id: "en_curso", titulo: "En curso" },
  { id: "hecha", titulo: "Hecha" },
] as const;
export type Columna = (typeof columnas)[number]["id"];

export function columnaDe(t: {
  completada: boolean;
  enCurso: boolean;
}): Columna {
  return t.completada ? "hecha" : t.enCurso ? "en_curso" : "pendiente";
}

export const paleta = [
  "#737373",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
] as const;

// color estable según el nombre (sin gris), para tags nuevos
export function colorPorDefecto(nombre: string) {
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return paleta[1 + (h % (paleta.length - 1))];
}

export type TagData = { nombre: string; color: string; icono: string | null };
export type GrupoData = { id: number; nombre: string; color: string };
