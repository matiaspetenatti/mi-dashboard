export const estadosAnime = [
  "planeado",
  "viendo",
  "completado",
  "en_pausa",
  "abandonado",
] as const

export type EstadoAnime = (typeof estadosAnime)[number]

export const etiquetasEstadoAnime: Record<EstadoAnime, string> = {
  planeado: "Planeado",
  viendo: "Viendo",
  completado: "Completado",
  en_pausa: "En pausa",
  abandonado: "Abandonado",
}

export const clasesEstadoAnime: Record<EstadoAnime, string> = {
  planeado: "bg-surface-container text-muted-foreground",
  viendo: "bg-signal-blue/10 text-signal-blue",
  completado: "bg-success-container text-success",
  en_pausa: "bg-warning-container text-warning",
  abandonado: "bg-error-container text-error",
}

export const opcionesOrdenAnimes = [
  { value: "puntaje_desc", label: "Mejor puntaje" },
  { value: "agregado_desc", label: "Agregados recientes" },
  { value: "progreso_desc", label: "Mayor progreso" },
  { value: "fecha_desc", label: "Emisión reciente" },
  { value: "titulo_asc", label: "Título A-Z" },
  { value: "score_desc", label: "Mejor score MAL" },
] as const

export type OrdenAnimes = (typeof opcionesOrdenAnimes)[number]["value"]

export const ANIMES_POR_PAGINA = 15
