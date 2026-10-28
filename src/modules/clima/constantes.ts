import type { UbicacionClima } from "./types";

export const CLIMA_TAG = "clima";

/**
 * Ubicación de respaldo: Río Cuarto, Córdoba.
 * Se usa hasta que el usuario guarde otra ubicación desde el módulo.
 */
export const UBICACION_POR_DEFECTO: UbicacionClima = {
  id: null,
  etiqueta: "Río Cuarto, Córdoba",
  latitud: -33.14787323266141,
  longitud: -64.3562331031547,
  esActiva: true,
};

/** Tope de ubicaciones guardadas para mantener el selector manejable. */
export const MAX_UBICACIONES_CLIMA = 10;
