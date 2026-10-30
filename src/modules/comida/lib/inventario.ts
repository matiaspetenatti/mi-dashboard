import { diasHasta, textoDiasRelativo } from "@/lib/format";
import type { IngredienteReceta, ItemComida } from "../schema";
import { DIAS_POR_VENCER } from "../constantes";
import {
  convertir,
  formatearCantidad,
  mismoIngrediente,
  normalizarNombre,
} from "./cantidades";

/** Ingredientes del inventario (los utensilios no son consumibles). */
export function ingredientesDeStock(items: ItemComida[]) {
  return items.filter((item) => item.tipo === "ingrediente");
}

/** Utensilios de barra: la IA los recibe como herramientas disponibles. */
export function utensiliosDeStock(items: ItemComida[]) {
  return items.filter((item) => item.tipo === "utensilio");
}

/** Busca el ítem del inventario que corresponde a un nombre de receta. */
export function buscarEnStock(nombre: string, items: ItemComida[]) {
  return ingredientesDeStock(items).find((item) =>
    mismoIngrediente(item.nombre, nombre),
  );
}

/**
 * ¿El stock alcanza para la cantidad pedida? Si las unidades no son
 * compatibles alcanza con tener el ingrediente cargado: la conversión exacta
 * (atados, latas) no siempre existe y preferimos no bloquear la receta.
 */
export function alcanzaStock(
  item: ItemComida,
  cantidad: number | null,
  unidad: string,
) {
  if (item.tipo === "utensilio") return true;
  if (cantidad === null) return item.cantidad > 0;
  const convertida = convertir(cantidad, unidad, item.unidad);
  if (convertida === null) return item.cantidad > 0;
  return item.cantidad + 0.0001 >= convertida;
}

export type FaltanteReceta = {
  nombre: string;
  cantidad: number | null;
  unidad: string;
  detalle: string | null;
  opcional: boolean;
  /** Cantidad que falta comprar; null si no se pudo calcular. */
  faltante: number | null;
  unidadFaltante: string;
  enStock: boolean;
};

/**
 * Compara los ingredientes de una receta contra el inventario. Devuelve solo
 * los que faltan (o están por debajo de la cantidad necesaria).
 */
export function calcularFaltantes(
  ingredientes: IngredienteReceta[],
  items: ItemComida[],
): FaltanteReceta[] {
  const faltantes: FaltanteReceta[] = [];

  for (const ingrediente of ingredientes) {
    const item = buscarEnStock(ingrediente.nombre, items);

    if (!item) {
      faltantes.push({
        nombre: ingrediente.nombre,
        cantidad: ingrediente.cantidad,
        unidad: ingrediente.unidad,
        detalle: ingrediente.detalle,
        opcional: ingrediente.opcional,
        faltante: ingrediente.cantidad,
        unidadFaltante: ingrediente.unidad,
        enStock: false,
      });
      continue;
    }

    if (alcanzaStock(item, ingrediente.cantidad, ingrediente.unidad)) continue;

    const necesaria =
      ingrediente.cantidad === null
        ? null
        : convertir(ingrediente.cantidad, ingrediente.unidad, item.unidad);

    faltantes.push({
      nombre: ingrediente.nombre,
      cantidad: ingrediente.cantidad,
      unidad: ingrediente.unidad,
      detalle: ingrediente.detalle,
      opcional: ingrediente.opcional,
      faltante:
        necesaria === null ? null : Math.max(0, necesaria - item.cantidad),
      unidadFaltante: item.unidad,
      enStock: true,
    });
  }

  return faltantes;
}

/** Etiqueta corta para el recetario: "Tenés todo" o "Faltan 2". */
export function resumenFaltantes(
  ingredientes: IngredienteReceta[],
  items: ItemComida[],
) {
  if (ingredientes.length === 0) {
    return { faltan: 0, total: 0, texto: "Sin ingredientes cargados" };
  }
  const faltantes = calcularFaltantes(ingredientes, items);
  const obligatorios = faltantes.filter((faltante) => !faltante.opcional);
  return {
    faltan: obligatorios.length,
    total: ingredientes.length,
    texto:
      faltantes.length === 0
        ? "Tenés todo"
        : `Faltan ${faltantes.length}`,
  };
}

export type DescuentoPropuesto = {
  ingredienteId: number;
  nombre: string;
  /** Cantidad a descontar en la unidad del inventario. */
  cantidad: number;
  unidad: string;
  stockActual: number;
  /** Cantidad que quedaría luego del descuento. */
  restante: number;
  texto: string;
};

/**
 * Propone el descuento de stock de una receta. Nunca se aplica solo: la UI
 * muestra estas cantidades editables y el usuario confirma.
 */
export function proponerDescuento(
  ingredientes: IngredienteReceta[],
  items: ItemComida[],
): DescuentoPropuesto[] {
  const propuestas: DescuentoPropuesto[] = [];

  for (const ingrediente of ingredientes) {
    const item = buscarEnStock(ingrediente.nombre, items);
    if (!item) continue;

    const cantidad =
      ingrediente.cantidad === null
        ? item.cantidad
        : (convertir(ingrediente.cantidad, ingrediente.unidad, item.unidad) ??
          ingrediente.cantidad);

    const aDescontar = Math.min(item.cantidad, cantidad);
    if (aDescontar <= 0) continue;

    const restante = Math.max(0, item.cantidad - aDescontar);
    propuestas.push({
      ingredienteId: item.id,
      nombre: item.nombre,
      cantidad: Number(aDescontar.toFixed(3)),
      unidad: item.unidad,
      stockActual: item.cantidad,
      restante: Number(restante.toFixed(3)),
      texto: `${formatearCantidad(
        Number(aDescontar.toFixed(3)),
        item.unidad,
      )} de ${formatearCantidad(item.cantidad, item.unidad)}`,
    });
  }

  return propuestas;
}

/* ── Vencimientos ─────────────────────────────────────────────────────── */

export type EstadoVencimiento = "sin-fecha" | "vencido" | "hoy" | "pronto" | "ok";

export type Vencimiento = {
  estado: EstadoVencimiento;
  dias: number | null;
  texto: string;
};

export function vencimientoDe(
  caducaEn: string | null,
  hoy: string,
): Vencimiento {
  if (!caducaEn) return { estado: "sin-fecha", dias: null, texto: "Sin fecha" };
  const dias = diasHasta(caducaEn, hoy);

  if (dias < 0) {
    return {
      estado: "vencido",
      dias,
      texto: `Vencido ${textoDiasRelativo(dias)}`,
    };
  }
  if (dias === 0) return { estado: "hoy", dias, texto: "Vence hoy" };
  if (dias <= DIAS_POR_VENCER) {
    return { estado: "pronto", dias, texto: `Vence ${textoDiasRelativo(dias)}` };
  }
  return { estado: "ok", dias, texto: textoDiasRelativo(dias) };
}

export function porVencer(items: ItemComida[], hoy: string) {
  return ingredientesDeStock(items).filter((item) => {
    if (!item.caducaEn) return false;
    const dias = diasHasta(item.caducaEn, hoy);
    return dias <= DIAS_POR_VENCER;
  });
}

/** Ítems cuyo stock está en el mínimo o por debajo. */
export function stockBajo(items: ItemComida[]) {
  return ingredientesDeStock(items).filter(
    (item) => item.stockMinimo !== null && item.cantidad <= item.stockMinimo,
  );
}

/** Clave normalizada para mergear ítems de la lista con el inventario. */
export function claveInventario(nombre: string) {
  return normalizarNombre(nombre);
}

/* ── Categoría sugerida ───────────────────────────────────────────────── */

const PALABRAS_CATEGORIA: Array<{
  categoria: string;
  palabras: string[];
}> = [
  {
    categoria: "carnes",
    palabras: [
      "pollo",
      "carne",
      "picada",
      "cerdo",
      "vaca",
      "pescado",
      "merluza",
      "atun",
      "jamon",
      "salchicha",
      "chorizo",
      "milanesa",
      "bondiola",
      "cordero",
    ],
  },
  {
    categoria: "lacteos",
    palabras: [
      "leche",
      "yogur",
      "queso",
      "crema",
      "manteca",
      "huevo",
      "ricota",
      "muzzarella",
      "dulce de leche",
    ],
  },
  {
    categoria: "verduras",
    palabras: [
      "tomate",
      "cebolla",
      "ajo",
      "papa",
      "batata",
      "zanahoria",
      "espinaca",
      "lechuga",
      "morron",
      "zapallo",
      "calabaza",
      "zucchini",
      "brocoli",
      "acelga",
      "apio",
      "puerro",
      "pepino",
      "berenjena",
      "choclo",
    ],
  },
  {
    categoria: "frutas",
    palabras: [
      "manzana",
      "banana",
      "naranja",
      "limon",
      "pera",
      "durazno",
      "frutilla",
      "uva",
      "mandarina",
      "palta",
    ],
  },
  {
    categoria: "almacen",
    palabras: [
      "arroz",
      "fideo",
      "pasta",
      "harina",
      "aceite",
      "vinagre",
      "sal",
      "azucar",
      "yerba",
      "cafe",
      "te",
      "lenteja",
      "garbanzo",
      "poroto",
      "pan",
      "galleta",
      "avena",
      "polenta",
      "salsa",
      "pure",
      "caldo",
      "especia",
      "pimienta",
      "oregano",
      "comino",
    ],
  },
  {
    categoria: "bebidas",
    palabras: [
      "agua",
      "jugo",
      "gaseosa",
      "vino",
      "cerveza",
      "gin",
      "vodka",
      "ron",
      "whisky",
      "campari",
      "vermut",
      "aperol",
      "soda",
      "tonica",
    ],
  },
  {
    categoria: "congelados",
    palabras: ["congelado", "helado", "hielo"],
  },
  {
    categoria: "preparadas",
    palabras: ["tupper", "porcion", "guiso", "tarta", "empanada", "sopa"],
  },
];

/** Adivina la categoría por el nombre, para no obligar a elegirla siempre. */
export function categoriaSugerida(nombre: string) {
  const normal = normalizarNombre(nombre);
  const encontrada = PALABRAS_CATEGORIA.find(({ palabras }) =>
    palabras.some((palabra) => normal.includes(palabra)),
  );
  return encontrada?.categoria ?? "otros";
}
