import type {
  MomentoMenu,
  OrigenLista,
  OrigenReceta,
  TonoReceta,
  TipoItemComida,
  TipoReceta,
  UbicacionComida,
} from "./schema";

/** Clave de caché del módulo (se invalida con `updateTag`). */
export const COMIDA_TAG = "comida";

/** Ruta del módulo, usada en enlaces y revalidaciones. */
export const COMIDA_HREF = "/comida";

/* ── Pestañas ─────────────────────────────────────────────────────────── */

export type VistaComida =
  | "despensa"
  | "chef"
  | "menu"
  | "recetario"
  | "compras";

export const PESTANAS_COMIDA: Array<{
  vista: VistaComida;
  label: string;
  href: string;
}> = [
  { vista: "despensa", label: "Despensa", href: "/comida" },
  { vista: "chef", label: "Chef IA", href: "/comida?vista=chef" },
  { vista: "menu", label: "Menú", href: "/comida?vista=menu" },
  { vista: "recetario", label: "Recetario", href: "/comida?vista=recetario" },
  { vista: "compras", label: "Compras", href: "/comida?vista=compras" },
];

export function vistaComida(valor: string | undefined): VistaComida {
  const encontrada = PESTANAS_COMIDA.find((pestana) => pestana.vista === valor);
  return encontrada?.vista ?? "despensa";
}

/* ── Categorías y ubicaciones ─────────────────────────────────────────── */

export type CategoriaComida =
  | "carnes"
  | "verduras"
  | "frutas"
  | "lacteos"
  | "almacen"
  | "bebidas"
  | "congelados"
  | "preparadas"
  | "bar"
  | "otros";

export const CATEGORIAS: Array<{
  valor: CategoriaComida;
  label: string;
  /** Emoji del medallón para no sumar dependencias de iconos por categoría. */
  emoji: string;
}> = [
  { valor: "carnes", label: "Carnes y pescados", emoji: "🥩" },
  { valor: "verduras", label: "Verduras y frutas", emoji: "🥬" },
  { valor: "frutas", label: "Frutas", emoji: "🍎" },
  { valor: "lacteos", label: "Lácteos y huevos", emoji: "🥛" },
  { valor: "almacen", label: "Almacén", emoji: "🍝" },
  { valor: "bebidas", label: "Bebidas", emoji: "🧃" },
  { valor: "congelados", label: "Congelados", emoji: "🧊" },
  { valor: "preparadas", label: "Comidas preparadas", emoji: "🍱" },
  { valor: "bar", label: "Barra y coctelería", emoji: "🍸" },
  { valor: "otros", label: "Otros", emoji: "🧺" },
];

const MAPA_CATEGORIAS = new Map(
  CATEGORIAS.map((categoria) => [categoria.valor, categoria]),
);

export function categoriaComida(valor: string): CategoriaComida {
  return MAPA_CATEGORIAS.has(valor as CategoriaComida)
    ? (valor as CategoriaComida)
    : "otros";
}

export function etiquetaCategoria(valor: string) {
  return MAPA_CATEGORIAS.get(valor as CategoriaComida)?.label ?? "Otros";
}

export function emojiCategoria(valor: string) {
  return MAPA_CATEGORIAS.get(valor as CategoriaComida)?.emoji ?? "🧺";
}

export const UBICACIONES: Array<{ valor: UbicacionComida; label: string }> = [
  { valor: "heladera", label: "Heladera" },
  { valor: "freezer", label: "Freezer" },
  { valor: "despensa", label: "Despensa" },
  { valor: "bar", label: "Barra" },
];

export function etiquetaUbicacion(valor: string) {
  return UBICACIONES.find((ubicacion) => ubicacion.valor === valor)?.label ?? "—";
}

export const TIPOS_ITEM: Array<{ valor: TipoItemComida; label: string }> = [
  { valor: "ingrediente", label: "Ingrediente" },
  { valor: "utensilio", label: "Utensilio de bar" },
];

/* ── Unidades ─────────────────────────────────────────────────────────── */

export type UnidadComida =
  | "unidad"
  | "g"
  | "kg"
  | "ml"
  | "l"
  | "atado"
  | "lata"
  | "paquete"
  | "taza"
  | "cucharada"
  | "cucharadita"
  | "diente"
  | "rodaja"
  | "pizca";

export const UNIDADES: Array<{ valor: UnidadComida; label: string }> = [
  { valor: "unidad", label: "unidad/es" },
  { valor: "g", label: "gramos" },
  { valor: "kg", label: "kilos" },
  { valor: "ml", label: "mililitros" },
  { valor: "l", label: "litros" },
  { valor: "atado", label: "atado/s" },
  { valor: "lata", label: "lata/s" },
  { valor: "paquete", label: "paquete/s" },
  { valor: "taza", label: "taza/s" },
  { valor: "cucharada", label: "cucharada/s" },
  { valor: "cucharadita", label: "cucharadita/s" },
  { valor: "diente", label: "diente/s" },
  { valor: "rodaja", label: "rodaja/s" },
  { valor: "pizca", label: "pizca/s" },
];

/** Unidades de peso y volumen que se pueden convertir entre sí. */
export const UNIDADES_METRICAS = ["g", "kg", "ml", "l"] as const;

/** Abreviatura corta para tablas y tarjetas. */
export function abreviaturaUnidad(unidad: string) {
  switch (unidad) {
    case "unidad":
      return "u";
    case "cucharada":
      return "cda";
    case "cucharadita":
      return "cdta";
    default:
      return unidad;
  }
}

/* ── Recetas ──────────────────────────────────────────────────────────── */

export const TIPOS_RECETA: Array<{ valor: TipoReceta; label: string }> = [
  { valor: "desayuno", label: "Desayuno" },
  { valor: "almuerzo", label: "Almuerzo" },
  { valor: "cena", label: "Cena" },
  { valor: "merienda", label: "Merienda" },
  { valor: "postre", label: "Postre" },
  { valor: "snack", label: "Snack" },
  { valor: "trago", label: "Trago" },
];

/** Tipos que ofrece el Chef IA en modo cocina (los tragos van aparte). */
export const TIPOS_COCINA: TipoReceta[] = [
  "desayuno",
  "almuerzo",
  "cena",
  "merienda",
  "postre",
  "snack",
];

export function etiquetaTipoReceta(valor: string) {
  return TIPOS_RECETA.find((tipo) => tipo.valor === valor)?.label ?? "Receta";
}

export const TONOS: Array<{
  valor: TonoReceta;
  label: string;
  descripcion: string;
}> = [
  {
    valor: "rapido",
    label: "Rápido",
    descripcion: "Hasta 25 minutos y pocos pasos",
  },
  {
    valor: "sencillo",
    label: "Sencillo",
    descripcion: "Cotidiano, sin técnica complicada",
  },
  {
    valor: "elaborado",
    label: "Elaborado",
    descripcion: "Más pasos, tiempos y técnica",
  },
];

export function etiquetaTono(valor: string) {
  return TONOS.find((tono) => tono.valor === valor)?.label ?? "Sencillo";
}

export const ORIGENES_RECETA: Array<{ valor: OrigenReceta; label: string }> = [
  { valor: "ia", label: "Generada por IA" },
  { valor: "manual", label: "Cargada a mano" },
];

/* ── Menú semanal ─────────────────────────────────────────────────────── */

export const MOMENTOS: Array<{
  valor: MomentoMenu;
  label: string;
  corto: string;
}> = [
  { valor: "desayuno", label: "Desayuno", corto: "Desayuno" },
  { valor: "almuerzo", label: "Almuerzo", corto: "Almuerzo" },
  { valor: "merienda", label: "Merienda", corto: "Merienda" },
  { valor: "cena", label: "Cena", corto: "Cena" },
];

export function etiquetaMomento(valor: string) {
  return MOMENTOS.find((momento) => momento.valor === valor)?.label ?? "Comida";
}

/**
 * Momentos que resuelve la generación principal de IA (un solo llamado).
 * Desayunos y meriendas se completan con un segundo llamado opcional.
 */
export const MOMENTOS_PRINCIPALES: MomentoMenu[] = ["almuerzo", "cena"];

export const DIAS_SEMANA = 7;

/* ── Lista de compras ─────────────────────────────────────────────────── */

export const ORIGENES_LISTA: Array<{ valor: OrigenLista; label: string }> = [
  { valor: "manual", label: "Manual" },
  { valor: "stock", label: "Stock bajo" },
  { valor: "receta", label: "Faltante de receta" },
  { valor: "menu", label: "Menú semanal" },
];

/* ── IA ───────────────────────────────────────────────────────────────── */

export const IA_URL = "https://ai-gateway.kilo.ai/api/v1";

/**
 * Modelos gratuitos verificados contra el gateway (octubre 2026).
 * El orden importa: el primero es el default y los siguientes son fallback
 * ante 429, 5xx o JSON inválido.
 */
export const MODELOS_IA = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nvidia/nemotron-3.5-lightning:free",
  "kilo-auto/free",
] as const;

/** Override opcional por entorno, sin tocar código. */
export function modelosIa(): string[] {
  const override = process.env.KILO_MODELO?.trim();
  if (override) {
    return [override, ...MODELOS_IA.filter((modelo) => modelo !== override)];
  }
  return [...MODELOS_IA];
}

export const IA_TIMEOUT_MS = 90_000;

/** Tope de ingredientes que se le mandan a la IA para no inflar el prompt. */
export const IA_MAX_INGREDIENTES = 40;

/** Máximo de ingredientes extra que la IA puede sugerir. */
export const IA_MAX_EXTRAS = 2;

/* ── Umbrales de la UI ────────────────────────────────────────────────── */

/** Días hacia adelante que cuentan como "por vencer". */
export const DIAS_POR_VENCER = 3;

/** Mensajes rotativos mientras la IA cocina. */
export const MENSAJES_IA = [
  "Leyendo tu despensa…",
  "Pensando qué combina mejor…",
  "Ajustando cantidades y tiempos…",
  "Revisando que no falte nada…",
  "Escribiendo la receta…",
];
