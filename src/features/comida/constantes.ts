import type {
  MomentoMenu,
  OrigenLista,
  OrigenReceta,
  TonoReceta,
  TipoItemComida,
  TipoReceta,
  UbicacionComida,
} from "@/server/db/schema"

export type VistaComida = "despensa" | "recetario" | "menu" | "compras"

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
  | "otros"

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
  | "pizca"

export const CATEGORIAS: Array<{
  valor: CategoriaComida
  label: string
  emoji: string
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
]

export const UBICACIONES: Array<{ valor: UbicacionComida; label: string }> = [
  { valor: "heladera", label: "Heladera" },
  { valor: "freezer", label: "Freezer" },
  { valor: "despensa", label: "Despensa" },
  { valor: "bar", label: "Barra" },
]

export const TIPOS_ITEM: Array<{ valor: TipoItemComida; label: string }> = [
  { valor: "ingrediente", label: "Ingrediente" },
  { valor: "utensilio", label: "Utensilio de bar" },
]

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
]

export const TIPOS_RECETA: Array<{ valor: TipoReceta; label: string }> = [
  { valor: "desayuno", label: "Desayuno" },
  { valor: "almuerzo", label: "Almuerzo" },
  { valor: "cena", label: "Cena" },
  { valor: "merienda", label: "Merienda" },
  { valor: "postre", label: "Postre" },
  { valor: "snack", label: "Snack" },
  { valor: "trago", label: "Trago" },
]

export const TONOS: Array<{
  valor: TonoReceta
  label: string
  descripcion: string
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
]

export const ORIGENES_RECETA: Array<{ valor: OrigenReceta; label: string }> = [
  { valor: "ia", label: "Generada por IA" },
  { valor: "manual", label: "Cargada a mano" },
]

export const MOMENTOS: Array<{
  valor: MomentoMenu
  label: string
  corto: string
}> = [
  { valor: "desayuno", label: "Desayuno", corto: "Desayuno" },
  { valor: "almuerzo", label: "Almuerzo", corto: "Almuerzo" },
  { valor: "merienda", label: "Merienda", corto: "Merienda" },
  { valor: "cena", label: "Cena", corto: "Cena" },
]

export const ORIGENES_LISTA: Array<{ valor: OrigenLista; label: string }> = [
  { valor: "manual", label: "Manual" },
  { valor: "stock", label: "Stock bajo" },
  { valor: "receta", label: "Faltante de receta" },
  { valor: "menu", label: "Menú semanal" },
]

const MAPA_CATEGORIAS = new Map(
  CATEGORIAS.map((categoria) => [categoria.valor, categoria]),
)

export function categoriaComida(valor: string): CategoriaComida {
  return MAPA_CATEGORIAS.has(valor as CategoriaComida)
    ? (valor as CategoriaComida)
    : "otros"
}

export function etiquetaCategoria(valor: string) {
  return MAPA_CATEGORIAS.get(valor as CategoriaComida)?.label ?? "Otros"
}

export function emojiCategoria(valor: string) {
  return MAPA_CATEGORIAS.get(valor as CategoriaComida)?.emoji ?? "🧺"
}

export function etiquetaUbicacion(valor: string) {
  return UBICACIONES.find((ubicacion) => ubicacion.valor === valor)?.label ?? "—"
}

export function abreviaturaUnidad(unidad: string) {
  switch (unidad) {
    case "unidad":
      return "u"
    case "cucharada":
      return "cda"
    case "cucharadita":
      return "cdta"
    default:
      return unidad
  }
}

export function etiquetaTipoReceta(valor: string) {
  return TIPOS_RECETA.find((tipo) => tipo.valor === valor)?.label ?? "Receta"
}

export function etiquetaTono(valor: string) {
  return TONOS.find((tono) => tono.valor === valor)?.label ?? "Sencillo"
}

export function etiquetaMomento(valor: string) {
  return MOMENTOS.find((momento) => momento.valor === valor)?.label ?? "Comida"
}

export function etiquetaOrigenLista(valor: string) {
  return ORIGENES_LISTA.find((origen) => origen.valor === valor)?.label ?? "Manual"
}

export const DIAS_POR_VENCER = 3
