import type {
  Cuatrimestre,
  EstadoCarrera,
  EstadoExamen,
  EstadoMateria,
  ResultadoExamen,
  TipoExamen,
  TipoSesion,
} from "./schema";

export type VarianteBadge =
  | "primary"
  | "secondary"
  | "tertiary"
  | "success"
  | "warning"
  | "destructive"
  | "neutral"
  | "outline";

export const paletaCarreras = [
  "#8b4a2b",
  "#6750a4",
  "#386a52",
  "#0b6bcb",
  "#a23b72",
  "#7d6a00",
  "#3d5a80",
  "#7a4f01",
] as const;

export const colorCarreraPorDefecto = paletaCarreras[0];

export const aniosMateria = [1, 2, 3, 4, 5, 6] as const;

export const etiquetasEstadoCarrera: Record<EstadoCarrera, string> = {
  cursando: "Cursando",
  pausada: "Pausada",
  graduada: "Graduada",
  abandonada: "Abandonada",
};

export const variantesEstadoCarrera: Record<EstadoCarrera, VarianteBadge> = {
  cursando: "primary",
  pausada: "warning",
  graduada: "success",
  abandonada: "neutral",
};

export const etiquetasEstadoMateria: Record<EstadoMateria, string> = {
  pendiente: "Pendiente",
  cursando: "Cursando",
  regular: "Regular",
  aprobada: "Aprobada",
  libre: "Libre",
};

export const variantesEstadoMateria: Record<EstadoMateria, VarianteBadge> = {
  pendiente: "neutral",
  cursando: "primary",
  regular: "warning",
  aprobada: "success",
  libre: "outline",
};

export const etiquetasCuatrimestre: Record<Cuatrimestre, string> = {
  "1": "1° cuatrimestre",
  "2": "2° cuatrimestre",
  anual: "Anual",
};

export const etiquetasTipoExamen: Record<TipoExamen, string> = {
  parcial: "Parcial",
  final: "Final",
  recuperatorio: "Recuperatorio",
  tp: "Trabajo práctico",
  coloquio: "Coloquio",
  otro: "Otro",
};

export const etiquetasEstadoExamen: Record<EstadoExamen, string> = {
  programado: "Programado",
  rendido: "Rendido",
  ausente: "Ausente",
};

export const variantesEstadoExamen: Record<EstadoExamen, VarianteBadge> = {
  programado: "primary",
  rendido: "success",
  ausente: "destructive",
};

export const etiquetasResultadoExamen: Record<ResultadoExamen, string> = {
  aprobado: "Aprobado",
  desaprobado: "Desaprobado",
};

export const variantesResultadoExamen: Record<ResultadoExamen, VarianteBadge> = {
  aprobado: "success",
  desaprobado: "destructive",
};

export const etiquetasTipoSesion: Record<TipoSesion, string> = {
  trabajo: "Trabajo",
  descanso_corto: "Descanso corto",
  descanso_largo: "Descanso largo",
};

export const notasAprobado = 4;
