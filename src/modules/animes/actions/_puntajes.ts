import "server-only";

import {
  CRITERIOS_ANIME,
  PUNTAJE_MAXIMO_CRITERIO,
  crearPuntajesVacios,
  type PuntajesCriterios,
} from "@/modules/animes/lib/criterios";

/**
 * Lee los 10 criterios desde el `FormData`.
 * Los campos ausentes o vacíos quedan como `null` (sin calificar).
 * Devuelve `null` si algún valor no es un entero entre 0 y 10.
 */
export function leerPuntajesFormData(
  formData: FormData,
): PuntajesCriterios | null {
  const puntajes = crearPuntajesVacios();

  for (const criterio of CRITERIOS_ANIME) {
    const raw = formData.get(criterio.campo);
    if (raw === null || raw === "") continue;

    const valor = Number(raw);
    if (
      !Number.isInteger(valor) ||
      valor < 0 ||
      valor > PUNTAJE_MAXIMO_CRITERIO
    ) {
      return null;
    }

    puntajes[criterio.key] = valor;
  }

  return puntajes;
}
