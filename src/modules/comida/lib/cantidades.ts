import { UNIDADES, type UnidadComida } from "../constantes";

/**
 * Normaliza un nombre para comparar ingredientes entre la IA, el inventario y
 * la lista de compras: minúsculas, sin acentos, sin signos y con espacios
 * simples. "Pechuga de Pollo " y "pechuga  de pollo" terminan iguales.
 */
export function normalizarNombre(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Palabras que no aportan al comparar nombres ("p Echuga de pollo" vs
 * "pollo"). Se descartan para que el matching no dependa de la fórmula exacta.
 */
const VACIAS = new Set([
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "con",
  "sin",
  "y",
  "o",
  "al",
  "a",
  "en",
  "para",
  "un",
  "una",
  "unos",
  "unas",
  "fresco",
  "fresca",
  "frescos",
  "frescas",
  "entero",
  "entera",
  "picado",
  "picada",
  "rallado",
  "rallada",
  "cortado",
  "cortada",
]);

export function palabrasClave(texto: string) {
  return normalizarNombre(texto)
    .split(" ")
    .filter((palabra) => palabra.length > 2 && !VACIAS.has(palabra));
}

/**
 * Dos ingredientes son el mismo si comparten la palabra principal o si una
 * frase contiene a la otra. Evita falsos positivos obvios ("ajo" vs "ajo en
 * polvo" sí matchea; "pollo" vs "pollo y verdura" también).
 */
export function mismoIngrediente(a: string, b: string) {
  const normalA = normalizarNombre(a);
  const normalB = normalizarNombre(b);
  if (!normalA || !normalB) return false;
  if (normalA === normalB) return true;
  if (normalA.includes(normalB) || normalB.includes(normalA)) return true;

  const palabrasA = palabrasClave(a);
  const palabrasB = palabrasClave(b);
  if (palabrasA.length === 0 || palabrasB.length === 0) return false;

  const enComun = palabrasA.filter((palabra) => palabrasB.includes(palabra));
  // Con al menos una palabra significativa en común alcanza, salvo que sean
  // términos genéricos donde hace falta más evidencia.
  return enComun.length > 0 && enComun[0].length >= 4;
}

/* ── Parseo de cantidades ─────────────────────────────────────────────── */

const ALIAS_UNIDADES: Record<string, string> = {
  u: "unidad",
  un: "unidad",
  unidades: "unidad",
  unidad: "unidad",
  gr: "g",
  grs: "g",
  g: "g",
  gramos: "g",
  gramo: "g",
  kg: "kg",
  kilo: "kg",
  kilos: "kg",
  kilogramo: "kg",
  kilogramos: "kg",
  ml: "ml",
  cc: "ml",
  mililitros: "ml",
  l: "l",
  lt: "l",
  litro: "l",
  litros: "l",
  atado: "atado",
  atados: "atado",
  lata: "lata",
  latas: "lata",
  paquete: "paquete",
  paquetes: "paquete",
  taza: "taza",
  tazas: "taza",
  cda: "cucharada",
  cdas: "cucharada",
  cucharada: "cucharada",
  cucharadas: "cucharada",
  cdta: "cucharadita",
  cdtas: "cucharadita",
  cucharadita: "cucharadita",
  cucharaditas: "cucharadita",
  diente: "diente",
  dientes: "diente",
  rodaja: "rodaja",
  rodajas: "rodaja",
  pizca: "pizca",
  pizcas: "pizca",
};

const UNIDADES_VALIDAS = new Set<string>(UNIDADES.map((unidad) => unidad.valor));

export function unidadComida(valor: string): UnidadComida {
  const limpio = normalizarNombre(valor);
  const unidad = ALIAS_UNIDADES[limpio] ?? limpio;
  return UNIDADES_VALIDAS.has(unidad) ? (unidad as UnidadComida) : "unidad";
}

/** "500 g" -> { cantidad: 500, unidad: "g" }; "2" -> { cantidad: 2, unidad: "unidad" } */
export function parsearCantidad(texto: string) {
  const limpio = texto.trim().replace(",", ".");
  const coincidencia = limpio.match(
    /^(\d+(?:\.\d+)?)\s*(.*)$/,
  );
  if (!coincidencia) {
    return { cantidad: null as number | null, unidad: unidadComida(limpio) };
  }
  const cantidad = Number(coincidencia[1]);
  const unidad = coincidencia[2].trim();
  return {
    cantidad: Number.isFinite(cantidad) ? cantidad : null,
    unidad: unidad ? unidadComida(unidad) : "unidad",
  };
}

/* ── Conversión ───────────────────────────────────────────────────────── */

/**
 * Lleva una cantidad a la unidad base de su familia (g, ml o unidad).
 * Devuelve null si la unidad no es convertible.
 */
export function aUnidadBase(cantidad: number, unidad: string) {
  switch (unidad) {
    case "g":
      return { valor: cantidad, familia: "peso" as const };
    case "kg":
      return { valor: cantidad * 1000, familia: "peso" as const };
    case "ml":
      return { valor: cantidad, familia: "volumen" as const };
    case "l":
      return { valor: cantidad * 1000, familia: "volumen" as const };
    case "unidad":
    case "atado":
    case "lata":
    case "paquete":
    case "diente":
    case "rodaja":
      return { valor: cantidad, familia: "unidad" as const };
    default:
      return null;
  }
}

/**
 * Convierte `cantidad` de `desde` a `hacia`. Si no son compatibles devuelve
 * null (el llamador decide si alcanza con que exista el ítem).
 */
export function convertir(
  cantidad: number,
  desde: string,
  hacia: string,
): number | null {
  if (desde === hacia) return cantidad;
  const origen = aUnidadBase(cantidad, desde);
  const destino = aUnidadBase(1, hacia);
  if (!origen || !destino || origen.familia !== destino.familia) return null;
  return origen.valor / destino.valor;
}

/** Formatea una cantidad para mostrarla: 0,5 kg -> "0,5 kg". */
export function formatearCantidad(cantidad: number | null, unidad: string) {
  if (cantidad === null || !Number.isFinite(cantidad)) {
    return unidad === "unidad" ? "a gusto" : `a gusto (${unidad})`;
  }
  const numero = cantidad.toLocaleString("es-AR", {
    maximumFractionDigits: 2,
  });
  if (unidad === "unidad") return `${numero} u`;
  return `${numero} ${unidad}`;
}

/** Suma dos cantidades compatibles; si no lo son, prioriza la mayor. */
export function sumarCantidades(
  cantidadA: number,
  unidadA: string,
  cantidadB: number,
  unidadB: string,
) {
  const convertida = convertir(cantidadB, unidadB, unidadA);
  if (convertida === null) {
    return cantidadB > cantidadA
      ? { cantidad: cantidadB, unidad: unidadB }
      : { cantidad: cantidadA, unidad: unidadA };
  }
  return { cantidad: cantidadA + convertida, unidad: unidadA };
}

/**
 * Interpreta un ingrediente escrito como texto libre para el menú semanal:
 * "500 g de pollo" -> { nombre: "pollo", cantidad: 500, unidad: "g" }.
 * Si no empieza con un número, asume una unidad y deja el texto completo.
 */
export function parsearIngredienteTexto(texto: string) {
  const limpio = texto.trim();
  const partes = limpio.split(/\s+/);
  const primera = partes[0]?.replace(",", ".");

  if (!primera || !/^\d+(?:\.\d+)?$/.test(primera)) {
    return { nombre: limpio, cantidad: null as number | null, unidad: "unidad" };
  }

  const cantidad = Number(primera);
  let indice = 1;
  const posibleUnidad = partes[indice]?.toLowerCase();
  const unidad = posibleUnidad ? unidadComida(posibleUnidad) : "unidad";

  if (posibleUnidad && ALIAS_UNIDADES[posibleUnidad]) {
    indice += 1;
  }

  let nombre = partes.slice(indice).join(" ");
  nombre = nombre.replace(/^de\s+/i, "").trim();

  return {
    nombre: nombre || limpio,
    cantidad,
    unidad: nombre ? unidad : "unidad",
  };
}
