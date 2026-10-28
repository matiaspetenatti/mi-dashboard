import type { AnimeVisto } from "@/modules/animes/schema";

export const CRITERIOS_ANIME = [
  {
    key: "premisa",
    campo: "puntajePremisa",
    etiqueta: "Premisa / Concepto",
    descripcion: "¿Qué tan interesante o innovadora es la idea inicial?",
  },
  {
    key: "ritmo",
    campo: "puntajeRitmo",
    etiqueta: "Ritmo (Pacing)",
    descripcion: "¿Se siente aburrido/lento o demasiado apresurado?",
  },
  {
    key: "protagonista",
    campo: "puntajeProtagonista",
    etiqueta: "Protagonista",
    descripcion: "¿Es interesante, creíble o genera empatía?",
  },
  {
    key: "elenco",
    campo: "puntajeElenco",
    etiqueta: "Elenco Secundario",
    descripcion: "¿Aportan a la historia o solo hacen bulto?",
  },
  {
    key: "animacion",
    campo: "puntajeAnimacion",
    etiqueta: "Animación y Arte",
    descripcion: "¿Es visualmente atractivo y consistente?",
  },
  {
    key: "direccion",
    campo: "puntajeDireccion",
    etiqueta: "Dirección y Encuadre",
    descripcion: "Uso de la cámara, tono visual y ritmo de las escenas.",
  },
  {
    key: "bandaSonora",
    campo: "puntajeBandaSonora",
    etiqueta: "Banda Sonora (OST)",
    descripcion: "¿Eleva los momentos épicos o dramáticos?",
  },
  {
    key: "openings",
    campo: "puntajeOpenings",
    etiqueta: "Openings y Endings",
    descripcion: "Integración visual y musical de los temas principales.",
  },
  {
    key: "final",
    campo: "puntajeFinal",
    etiqueta: "Final / Conclusión",
    descripcion: "¿Tuvo un cierre digno o dejó cabos sueltos molestos?",
  },
  {
    key: "revisitabilidad",
    campo: "puntajeRevisitabilidad",
    etiqueta: "Revisitabilidad / Impacto",
    descripcion: "¿Lo volverías a ver o recomendarías a ojos cerrados?",
  },
] as const;

export type CriterioAnimeKey = (typeof CRITERIOS_ANIME)[number]["key"];
export type PuntajesCriterios = Record<CriterioAnimeKey, number | null>;
export type ColumnasPuntaje = Pick<
  AnimeVisto,
  (typeof CRITERIOS_ANIME)[number]["campo"]
>;

export const PUNTAJE_MAXIMO_CRITERIO = 10;
export const PUNTAJE_MAXIMO_TOTAL =
  CRITERIOS_ANIME.length * PUNTAJE_MAXIMO_CRITERIO;

export function crearPuntajesVacios(): PuntajesCriterios {
  return Object.fromEntries(
    CRITERIOS_ANIME.map((c) => [c.key, null]),
  ) as PuntajesCriterios;
}

export function extraerPuntajes(
  anime: Pick<AnimeVisto, (typeof CRITERIOS_ANIME)[number]["campo"]>,
): PuntajesCriterios {
  return Object.fromEntries(
    CRITERIOS_ANIME.map((c) => [c.key, anime[c.campo] ?? null]),
  ) as PuntajesCriterios;
}

export function aColumnasPuntaje(
  puntajes: PuntajesCriterios,
): ColumnasPuntaje {
  return Object.fromEntries(
    CRITERIOS_ANIME.map((c) => [c.campo, puntajes[c.key]]),
  ) as ColumnasPuntaje;
}

export function calcularTotalPuntajes(
  puntajes: Partial<PuntajesCriterios>,
): number | null {
  const valores = CRITERIOS_ANIME.map((c) => puntajes[c.key]).filter(
    (valor): valor is number => typeof valor === "number",
  );

  if (valores.length === 0) return null;
  return valores.reduce((total, valor) => total + valor, 0);
}

export function contarCriteriosCalificados(
  puntajes: Partial<PuntajesCriterios>,
): number {
  return CRITERIOS_ANIME.filter(
    (c) => typeof puntajes[c.key] === "number",
  ).length;
}

export function validarPuntajes(puntajes: PuntajesCriterios): boolean {
  return CRITERIOS_ANIME.every((c) => {
    const valor = puntajes[c.key];
    return (
      valor === null ||
      (Number.isInteger(valor) &&
        valor >= 0 &&
        valor <= PUNTAJE_MAXIMO_CRITERIO)
    );
  });
}

/**
 * Total que conviene mostrar en la UI:
 * 1. La suma de los criterios, si hay desglose.
 * 2. El total guardado, para animes viejos sin desglose.
 * 3. `null` cuando no hay puntaje (incluye los `0` sin desglose).
 */
export function puntajeMostrable(
  anime: Pick<AnimeVisto, "miPuntaje"> & ColumnasPuntaje,
): number | null {
  const total = calcularTotalPuntajes(extraerPuntajes(anime));
  if (total !== null) return total;

  return typeof anime.miPuntaje === "number" && anime.miPuntaje > 0
    ? anime.miPuntaje
    : null;
}
