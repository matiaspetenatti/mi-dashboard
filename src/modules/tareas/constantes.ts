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

export const categoriasEstado = [
  "pendiente",
  "en_progreso",
  "completado",
  "cancelado",
] as const;
export type CategoriaEstado = (typeof categoriasEstado)[number];

export const etiquetasCategoria: Record<CategoriaEstado, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
  cancelado: "Cancelado",
};

export const prioridades = ["urgente", "alta", "media", "baja"] as const;
export type Prioridad = (typeof prioridades)[number];

export const etiquetasPrioridad: Record<Prioridad, string> = {
  urgente: "Urgente",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export const ordenPrioridad: Record<Prioridad, number> = {
  urgente: 0,
  alta: 1,
  media: 2,
  baja: 3,
};

export const tiposVista = [
  "lista",
  "tablero",
  "tabla",
  "calendario",
  "cronograma",
] as const;
export type TipoVista = (typeof tiposVista)[number];

export const etiquetasTipoVista: Record<TipoVista, string> = {
  lista: "Lista",
  tablero: "Tablero",
  tabla: "Tabla",
  calendario: "Calendario",
  cronograma: "Cronograma",
};

export const paleta = [
  "#6750a4",
  "#386a52",
  "#8b4a2b",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#14b8a6",
  "#ec4899",
  "#737373",
] as const;

// color estable según el nombre, para etiquetas nuevas
export function colorPorDefecto(nombre: string) {
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return paleta[1 + (h % (paleta.length - 1))];
}

export function slugify(nombre: string) {
  const base = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "proyecto";
}

export function prefijoDe(nombre: string) {
  const limpio = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  return (limpio.slice(0, 3) || "TAR").padEnd(3, "X");
}

export type EstadoPorDefecto = {
  nombre: string;
  color: string;
  categoria: CategoriaEstado;
};

export const estadosPorDefecto: EstadoPorDefecto[] = [
  { nombre: "Por hacer", color: "#737373", categoria: "pendiente" },
  { nombre: "En curso", color: "#3b82f6", categoria: "en_progreso" },
  { nombre: "En revisión", color: "#8b5cf6", categoria: "en_progreso" },
  { nombre: "Hecho", color: "#22c55e", categoria: "completado" },
];

export type EtiquetaData = {
  id: number;
  nombre: string;
  color: string;
  icono: string | null;
};

export function textoVencimiento(fecha: string | null, hoy: string) {
  if (!fecha) return null;
  if (fecha === hoy) return "Hoy";
  const a = Date.parse(`${hoy}T00:00:00Z`);
  const b = Date.parse(`${fecha}T00:00:00Z`);
  const dias = Math.round((b - a) / 86_400_000);
  if (dias === 1) return "Mañana";
  if (dias === -1) return "Ayer";
  if (dias > 1 && dias <= 7) return `En ${dias} días`;
  if (dias < -1 && dias >= -7) return `Hace ${Math.abs(dias)} días`;
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${fecha}T00:00:00Z`));
}
