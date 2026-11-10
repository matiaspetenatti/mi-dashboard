import type {
  AlivioTetralgin,
  LateralidadDolor,
  PatronDolor,
} from "@/server/db/schema"

export type VistaSalud = "migrana" | "bienestar"

export const PATRONES: Array<{ valor: PatronDolor; label: string }> = [
  { valor: "pulsatil", label: "Pulsátil" },
  { valor: "opresivo", label: "Opresivo" },
  { valor: "punzante", label: "Punzante" },
]

export const LATERALIDADES: Array<{
  valor: LateralidadDolor
  label: string
}> = [
  { valor: "izquierdo", label: "Izquierdo" },
  { valor: "derecho", label: "Derecho" },
  { valor: "bilateral", label: "Bilateral" },
]

export const ALIVIOS: Array<{ valor: AlivioTetralgin; label: string }> = [
  { valor: "completo", label: "Completo" },
  { valor: "parcial", label: "Parcial" },
  { valor: "ninguno", label: "Sin alivio" },
]

export const AURA_TIPOS: Array<{ valor: string; label: string }> = [
  { valor: "visuales", label: "Visuales (destellos, escotomas)" },
  { valor: "sensitivas", label: "Sensitivas (hormigueo)" },
  { valor: "lenguaje", label: "Del lenguaje" },
  { valor: "motoras", label: "Motoras (debilidad)" },
]

export const SINTOMAS: Array<{ valor: string; label: string }> = [
  { valor: "nauseas", label: "Náuseas" },
  { valor: "vomitos", label: "Vómitos" },
  { valor: "fotofobia", label: "Fotofobia" },
  { valor: "sonofobia", label: "Sonofobia" },
  { valor: "osmofobia", label: "Osmofobia" },
  { valor: "mareo", label: "Mareo" },
  { valor: "vision-borrosa", label: "Visión borrosa" },
  { valor: "diarrea", label: "Diarrea" },
]

export type CategoriaFactor =
  | "emocional"
  | "sueno"
  | "alimentacion"
  | "ambiental"
  | "fisico"
  | "hormonal"
  | "otro"

export const CATEGORIAS_FACTORES: Array<{
  id: CategoriaFactor
  label: string
  descripcion: string
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
]

export const FACTORES: Array<{
  slug: string
  label: string
  categoria: CategoriaFactor
}> = [
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
  { slug: "menstruacion", label: "Menstruación", categoria: "hormonal" },
  { slug: "ovulacion", label: "Ovulación", categoria: "hormonal" },
  {
    slug: "anticonceptivos",
    label: "Anticonceptivos u hormonas",
    categoria: "hormonal",
  },
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
]

export const FACTORES_POR_SLUG = new Map(
  FACTORES.map((factor) => [factor.slug, factor]),
)

export const SLUGS_FACTORES = new Set(FACTORES.map((factor) => factor.slug))
export const SLUGS_SINTOMAS = new Set(SINTOMAS.map((sintoma) => sintoma.valor))
export const SLUGS_AURA = new Set(AURA_TIPOS.map((aura) => aura.valor))

export const SINTOMAS_POR_SLUG = new Map(
  SINTOMAS.map((sintoma) => [sintoma.valor, sintoma.label]),
)
export const AURA_POR_SLUG = new Map(
  AURA_TIPOS.map((aura) => [aura.valor, aura.label]),
)
export const PATRONES_POR_VALOR = new Map(
  PATRONES.map((patron) => [patron.valor, patron.label]),
)
export const LATERALIDADES_POR_VALOR = new Map(
  LATERALIDADES.map((lado) => [lado.valor, lado.label]),
)
export const ALIVIOS_POR_VALOR = new Map(
  ALIVIOS.map((alivio) => [alivio.valor, alivio.label]),
)
export const CATEGORIAS_POR_ID = new Map(
  CATEGORIAS_FACTORES.map((categoria) => [categoria.id, categoria]),
)

export function etiquetaFactor(slug: string) {
  return FACTORES_POR_SLUG.get(slug)?.label ?? slug
}

export function etiquetaSintoma(slug: string) {
  return SINTOMAS_POR_SLUG.get(slug) ?? slug
}

export function etiquetaAura(slug: string) {
  return AURA_POR_SLUG.get(slug) ?? slug
}

export const MAX_COMPRIMIDOS_TETRALGIN = 3
export const DIAS_SERIE = 90
export const DIAS_ANALISIS = 90

export function nivelDolor(intensidad: number) {
  if (intensidad <= 3) {
    return {
      label: "Leve",
      tono: "verde" as const,
      clase:
        "bg-success text-on-success dark:bg-success-container dark:text-on-success-container",
    }
  }
  if (intensidad <= 6) {
    return {
      label: "Moderada",
      tono: "ambar" as const,
      clase:
        "bg-warning text-on-warning dark:bg-warning-container dark:text-on-warning-container",
    }
  }
  if (intensidad <= 8) {
    return {
      label: "Severa",
      tono: "rojo" as const,
      clase:
        "bg-error text-on-error dark:bg-error-container dark:text-on-error-container",
    }
  }
  return {
    label: "Muy severa",
    tono: "rojo" as const,
    clase:
      "bg-error text-on-error ring-2 ring-inset ring-white/25 dark:bg-error-container dark:text-on-error-container",
  }
}
