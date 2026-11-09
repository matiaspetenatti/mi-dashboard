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
  planeado: "bg-surface-container-high text-heading",
  viendo: "bg-signal-blue text-white dark:text-forest-ink",
  completado:
    "bg-success text-on-success dark:bg-success-container dark:text-on-success-container",
  en_pausa:
    "bg-warning text-on-warning dark:bg-warning-container dark:text-on-warning-container",
  abandonado:
    "bg-error text-on-error dark:bg-error-container dark:text-on-error-container",
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
