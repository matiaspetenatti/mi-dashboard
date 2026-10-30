import type {
  AlivioTetralgin,
  LateralidadDolor,
  PatronDolor,
} from "./schema";

/** Clave de caché del módulo (se invalida con `updateTag`). */
export const SALUD_TAG = "salud";

/** Etiqueta de la ruta y del widget. */
export const SALUD_HREF = "/salud";

export type VistaSalud = "migrana" | "bienestar";

export function vistaSalud(valor: string | undefined): VistaSalud {
  return valor === "bienestar" ? "bienestar" : "migrana";
}

export const PATRONES: Array<{ valor: PatronDolor; label: string }> = [
  { valor: "pulsatil", label: "Pulsátil" },
  { valor: "opresivo", label: "Opresivo" },
  { valor: "punzante", label: "Punzante" },
];

export const LATERALIDADES: Array<{
  valor: LateralidadDolor;
  label: string;
}> = [
  { valor: "izquierdo", label: "Izquierdo" },
  { valor: "derecho", label: "Derecho" },
  { valor: "bilateral", label: "Bilateral" },
];

export const ALIVIOS: Array<{ valor: AlivioTetralgin; label: string }> = [
  { valor: "completo", label: "Completo" },
  { valor: "parcial", label: "Parcial" },
  { valor: "ninguno", label: "Sin alivio" },
];

export const AURA_TIPOS: Array<{ valor: string; label: string }> = [
  { valor: "visuales", label: "Visuales (destellos, escotomas)" },
  { valor: "sensitivas", label: "Sensitivas (hormigueo)" },
  { valor: "lenguaje", label: "Del lenguaje" },
  { valor: "motoras", label: "Motoras (debilidad)" },
];

export const SINTOMAS: Array<{ valor: string; label: string }> = [
  { valor: "nauseas", label: "Náuseas" },
  { valor: "vomitos", label: "Vómitos" },
  { valor: "fotofobia", label: "Fotofobia" },
  { valor: "sonofobia", label: "Sonofobia" },
  { valor: "osmofobia", label: "Osmofobia" },
  { valor: "mareo", label: "Mareo" },
  { valor: "vision-borrosa", label: "Visión borrosa" },
  { valor: "diarrea", label: "Diarrea" },
];

export type CategoriaFactor =
  | "emocional"
  | "sueno"
  | "alimentacion"
  | "ambiental"
  | "fisico"
  | "hormonal"
  | "otro";

export const CATEGORIAS_FACTORES: Array<{
  id: CategoriaFactor;
  label: string;
  descripcion: string;
}> = [
  {
    id: "emocional",
    label: "Emocionales",
    descripcion: "Carga mental y cambios de ánimo.",
  },
  {
    id: "sueno",
    label: "Sueño y descanso",
    descripcion: "Horarios y calidad del descanso.",
  },
  {
    id: "alimentacion",
    label: "Alimentación e hidratación",
    descripcion: "Comidas, bebidas y sustancias.",
  },
  {
    id: "ambiental",
    label: "Ambientales",
    descripcion: "Luz, ruido, clima y entorno.",
  },
  {
    id: "fisico",
    label: "Físicos y posturales",
    descripcion: "Esfuerzo, cuello y pantallas.",
  },
  {
    id: "hormonal",
    label: "Hormonales",
    descripcion: "Ciclo y tratamientos hormonales.",
  },
  {
    id: "otro",
    label: "Otros",
    descripcion: "Medicación, hábitos y casos sin identificar.",
  },
];

/**
 * Catálogo de desencadenantes de migraña tomado de la literatura clínica
 * habitual (factores dietarios, ambientales, del sueño, físicos y hormonales).
 */
export const FACTORES: Array<{
  slug: string;
  label: string;
  categoria: CategoriaFactor;
}> = [
  // Emocionales
  { slug: "estres", label: "Estrés", categoria: "emocional" },
  {
    slug: "post-estres",
    label: "Bajón después del estrés",
    categoria: "emocional",
  },
  { slug: "ansiedad", label: "Ansiedad", categoria: "emocional" },
  {
    slug: "emociones-fuertes",
    label: "Emociones fuertes",
    categoria: "emocional",
  },

  // Sueño
  {
    slug: "falta-sueno",
    label: "Dormir menos de 6 h",
    categoria: "sueno",
  },
  { slug: "dormir-de-mas", label: "Dormir de más", categoria: "sueno" },
  {
    slug: "horarios-irregulares",
    label: "Horarios irregulares",
    categoria: "sueno",
  },
  { slug: "jet-lag", label: "Viajes o jet lag", categoria: "sueno" },

  // Alimentación
  {
    slug: "comidas-omitidas",
    label: "Saltear comidas o ayuno",
    categoria: "alimentacion",
  },
  {
    slug: "deshidratacion",
    label: "Deshidratación",
    categoria: "alimentacion",
  },
  {
    slug: "alcohol",
    label: "Alcohol (vino tinto)",
    categoria: "alimentacion",
  },
  {
    slug: "cafeina-exceso",
    label: "Cafeína en exceso",
    categoria: "alimentacion",
  },
  {
    slug: "abstinencia-cafeina",
    label: "Abstinencia de cafeína",
    categoria: "alimentacion",
  },
  {
    slug: "quesos-curados",
    label: "Quesos curados (tiramina)",
    categoria: "alimentacion",
  },
  {
    slug: "embutidos",
    label: "Embutidos y nitritos",
    categoria: "alimentacion",
  },
  {
    slug: "glutamato",
    label: "Glutamato monosódico",
    categoria: "alimentacion",
  },
  { slug: "edulcorantes", label: "Edulcorantes", categoria: "alimentacion" },
  { slug: "chocolate", label: "Chocolate", categoria: "alimentacion" },

  // Ambientales
  {
    slug: "luces-brillantes",
    label: "Luces brillantes o reflejos",
    categoria: "ambiental",
  },
  { slug: "sol-intenso", label: "Sol intenso", categoria: "ambiental" },
  { slug: "luz-parpadeante", label: "Luz parpadeante", categoria: "ambiental" },
  { slug: "ruido-fuerte", label: "Ruido fuerte", categoria: "ambiental" },
  { slug: "olores-fuertes", label: "Olores fuertes", categoria: "ambiental" },
  {
    slug: "presion-atmosferica",
    label: "Cambios de presión o clima",
    categoria: "ambiental",
  },
  { slug: "calor-humedad", label: "Calor o humedad", categoria: "ambiental" },
  { slug: "frio-viento", label: "Frío o viento", categoria: "ambiental" },
  { slug: "altitud", label: "Altitud", categoria: "ambiental" },

  // Físicos
  {
    slug: "esfuerzo-fisico",
    label: "Esfuerzo físico intenso",
    categoria: "fisico",
  },
  {
    slug: "tension-cervical",
    label: "Tensión cervical",
    categoria: "fisico",
  },
  { slug: "malas-posturas", label: "Malas posturas", categoria: "fisico" },
  {
    slug: "pantallas",
    label: "Pantallas prolongadas",
    categoria: "fisico",
  },
  {
    slug: "traumatismo",
    label: "Golpe en la cabeza",
    categoria: "fisico",
  },

  // Hormonales
  { slug: "menstruacion", label: "Menstruación", categoria: "hormonal" },
  { slug: "ovulacion", label: "Ovulación", categoria: "hormonal" },
  {
    slug: "anticonceptivos",
    label: "Anticonceptivos u hormonas",
    categoria: "hormonal",
  },

  // Otros
  {
    slug: "analgesicos-exceso",
    label: "Uso excesivo de analgésicos",
    categoria: "otro",
  },
  { slug: "tabaco", label: "Tabaco", categoria: "otro" },
  {
    slug: "sin-trigger",
    label: "Sin desencadenante identificado",
    categoria: "otro",
  },
  { slug: "otro", label: "Otro (especificar)", categoria: "otro" },
];

export const FACTORES_POR_SLUG = new Map(
  FACTORES.map((factor) => [factor.slug, factor]),
);

export const SLUGS_FACTORES = new Set(FACTORES.map((factor) => factor.slug));

export const SLUGS_SINTOMAS = new Set(SINTOMAS.map((s) => s.valor));

export const SLUGS_AURA = new Set(AURA_TIPOS.map((a) => a.valor));

export const SINTOMAS_POR_SLUG = new Map(
  SINTOMAS.map((sintoma) => [sintoma.valor, sintoma.label]),
);

export const AURA_POR_SLUG = new Map(
  AURA_TIPOS.map((aura) => [aura.valor, aura.label]),
);

export const PATRONES_POR_VALOR = new Map(
  PATRONES.map((patron) => [patron.valor, patron.label]),
);

export const LATERALIDADES_POR_VALOR = new Map(
  LATERALIDADES.map((lado) => [lado.valor, lado.label]),
);

export const ALIVIOS_POR_VALOR = new Map(
  ALIVIOS.map((alivio) => [alivio.valor, alivio.label]),
);

/** Etiqueta legible de un desencadenante guardado por slug. */
export function etiquetaFactor(slug: string) {
  return FACTORES_POR_SLUG.get(slug)?.label ?? slug;
}

/** Etiqueta legible de un síntoma guardado por slug. */
export function etiquetaSintoma(slug: string) {
  return SINTOMAS_POR_SLUG.get(slug) ?? slug;
}

/** Etiqueta legible de un tipo de aura guardado por slug. */
export function etiquetaAura(slug: string) {
  return AURA_POR_SLUG.get(slug) ?? slug;
}

/** Máximo de comprimidos de Tetralgin que permite registrar el formulario. */
export const MAX_COMPRIMIDOS_TETRALGIN = 3;

/** Cantidad de días que se muestran en el gráfico de evolución. */
export const DIAS_SERIE = 90;

/** Cantidad de días que se usan para el mapa de desencadenantes y la efectividad. */
export const DIAS_ANALISIS = 90;

/** Etiquetas cortas para el nivel de dolor (escala EVA). */
export function nivelDolor(intensidad: number) {
  if (intensidad <= 3) {
    return {
      label: "Leve",
      clase: "bg-success-container text-on-success-container",
    };
  }
  if (intensidad <= 6) {
    return {
      label: "Moderada",
      clase: "bg-warning-container text-on-warning-container",
    };
  }
  if (intensidad <= 8) {
    return {
      label: "Severa",
      clase: "bg-error-container text-on-error-container",
    };
  }
  return { label: "Muy severa", clase: "bg-error text-on-error" };
}
