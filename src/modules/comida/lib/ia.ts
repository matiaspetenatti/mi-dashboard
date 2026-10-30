import "server-only";

import { z } from "zod";
import type {
  IngredienteReceta,
  MomentoMenu,
  NutricionReceta,
  TonoReceta,
  TipoReceta,
} from "../schema";
import {
  IA_MAX_EXTRAS,
  IA_TIMEOUT_MS,
  IA_URL,
  etiquetaTipoReceta,
  etiquetaTono,
  modelosIa,
} from "../constantes";
import { parsearCantidad } from "./cantidades";

/* ── Tipos públicos ───────────────────────────────────────────────────── */

export type IngredienteDisponible = {
  nombre: string;
  cantidad: number | null;
  unidad: string;
};

export type ContextoReceta = {
  modo: "cocina" | "trago";
  tipo: TipoReceta;
  tono: TonoReceta;
  minutos: number | null;
  porciones: number;
  /** Ingredientes elegidos de la despensa. */
  disponibles: IngredienteDisponible[];
  /** Utensilios de barra cargados en el inventario. */
  utensilios: string[];
  permitirExtras: boolean;
  sorprender: boolean;
  /** Títulos del recetario para no repetir. */
  evitar: string[];
  nota?: string;
};

export type RecetaGenerada = {
  titulo: string;
  tipo: TipoReceta;
  tono: TonoReceta;
  minutos: number;
  porciones: number;
  ingredientes: IngredienteReceta[];
  pasos: string[];
  tips: string | null;
  nutricion: NutricionReceta | null;
  herramientas: string[];
  vaso: string | null;
  tecnica: string | null;
};

export type SlotMenuGenerado = {
  titulo: string;
  minutos: number | null;
  ingredientes: string[];
  reutiliza: string | null;
};

export type DiaMenuGenerado = {
  fecha: string;
  slots: Partial<Record<MomentoMenu, SlotMenuGenerado>>;
};

export type ContextoMenu = {
  dias: string[];
  momentos: MomentoMenu[];
  disponibles: IngredienteDisponible[];
  recetas: string[];
  /** Slots ya cargados para que la IA no los repita. */
  yaPlanificado: Array<{ dia: string; titulo: string }>;
  nota?: string;
};

export class ErrorIA extends Error {
  readonly detalle: string[];

  constructor(mensaje: string, detalle: string[] = []) {
    super(mensaje);
    this.name = "ErrorIA";
    this.detalle = detalle;
  }
}

/* ── Esquemas de validación ───────────────────────────────────────────── */

const ingredienteSchema = z.object({
  nombre: z.string().trim().min(2),
  cantidad: z.union([z.string(), z.number(), z.null()]).optional(),
  detalle: z.string().optional().nullable(),
  opcional: z.boolean().optional(),
});

const nutricionSchema = z.object({
  kcal: z.coerce.number().min(0).max(5000),
  proteinas: z.coerce.number().min(0).max(500),
  carbos: z.coerce.number().min(0).max(500),
  grasas: z.coerce.number().min(0).max(500),
});

const recetaSchema = z.object({
  titulo: z.string().trim().min(3),
  tipo: z.string().optional(),
  tono: z.string().optional(),
  minutos: z.coerce.number().int().min(1).max(600),
  porciones: z.coerce.number().int().min(1).max(24),
  ingredientes: z.array(ingredienteSchema).min(2),
  pasos: z.array(z.string().trim().min(3)).min(3),
  tips: z.string().optional().nullable(),
  nutricion: nutricionSchema.optional().nullable(),
  herramientas: z.array(z.string().trim()).optional(),
  vaso: z.string().optional().nullable(),
  tecnica: z.string().optional().nullable(),
});

const slotMenuSchema = z.object({
  titulo: z.string().trim().min(3),
  minutos: z.coerce.number().int().min(1).max(600).optional().nullable(),
  ingredientes: z.array(z.string().trim().min(1)).optional(),
  reutiliza: z.string().optional().nullable(),
});

const menuSchema = z.object({
  dias: z
    .array(z.record(z.string(), z.unknown()))
    .min(1)
    .max(7),
});

/* ── Cliente del gateway ──────────────────────────────────────────────── */

function apiKey() {
  const key = process.env.KILO_API_KEY?.trim();
  if (!key) {
    throw new ErrorIA(
      "Falta configurar KILO_API_KEY. Agregala en .env.local para usar el Chef IA.",
    );
  }
  return key;
}

type RespuestaGateway = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

/** Extrae el primer objeto JSON de una respuesta que puede venir con texto. */
function extraerJson(texto: string): unknown {
  const limpio = texto
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(limpio);
  } catch {
    // Sigue con la búsqueda del primer bloque balanceado.
  }

  const inicio = limpio.indexOf("{");
  if (inicio === -1) throw new Error("La respuesta no contiene JSON");

  let profundidad = 0;
  let enCadena = false;
  let escapado = false;

  for (let indice = inicio; indice < limpio.length; indice += 1) {
    const caracter = limpio[indice];

    if (enCadena) {
      if (escapado) escapado = false;
      else if (caracter === "\\") escapado = true;
      else if (caracter === '"') enCadena = false;
      continue;
    }

    if (caracter === '"') enCadena = true;
    else if (caracter === "{") profundidad += 1;
    else if (caracter === "}") {
      profundidad -= 1;
      if (profundidad === 0) {
        return JSON.parse(limpio.slice(inicio, indice + 1));
      }
    }
  }

  throw new Error("El JSON de la respuesta quedó incompleto");
}

async function pedirContenido(
  modelo: string,
  mensajes: Array<{ role: "system" | "user"; content: string }>,
  temperatura: number,
) {
  const respuesta = await fetch(`${IA_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelo,
      messages: mensajes,
      temperature: temperatura,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(IA_TIMEOUT_MS),
  });

  const cuerpo = (await respuesta.json().catch(() => null)) as
    | RespuestaGateway
    | null;

  if (!respuesta.ok) {
    throw new Error(
      cuerpo?.error?.message ?? `El gateway respondió ${respuesta.status}`,
    );
  }

  const contenido = cuerpo?.choices?.[0]?.message?.content;
  if (!contenido) throw new Error("El modelo devolvió una respuesta vacía");
  return contenido;
}

/**
 * Pide un JSON válido y lo valida con Zod. Prueba los modelos gratuitos en
 * orden y, si el JSON llegó pero no cumple el esquema, intenta una reparación
 * con el mismo modelo antes de pasar al siguiente.
 */
async function generarJson<T>(
  system: string,
  user: string,
  esquema: z.ZodType<T>,
  temperatura: number,
) {
  const errores: string[] = [];

  for (const modelo of modelosIa()) {
    try {
      const contenido = await pedirContenido(
        modelo,
        [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperatura,
      );

      const crudo = extraerJson(contenido);
      const validado = esquema.safeParse(crudo);
      if (validado.success) return validado.data;

      errores.push(
        `${modelo}: ${validado.error.issues
          .slice(0, 3)
          .map((issue) => `${issue.path.join(".") || "raíz"} ${issue.message}`)
          .join("; ")}`,
      );

      // Reparación: se le devuelve su propia salida y se le pide corregirla.
      const reparado = await pedirContenido(
        modelo,
        [
          { role: "system", content: system },
          {
            role: "user",
            content: `${user}\n\nTu respuesta anterior fue:\n${contenido.slice(
              0,
              6000,
            )}\n\nNo cumple el formato pedido. Devolvé SOLO el JSON corregido, completo y válido.`,
          },
        ],
        temperatura,
      );

      const validadoReparado = esquema.safeParse(extraerJson(reparado));
      if (validadoReparado.success) return validadoReparado.data;

      errores.push(
        `${modelo}: la reparación tampoco cumplió el formato`,
      );
    } catch (error) {
      errores.push(
        `${modelo}: ${error instanceof Error ? error.message : "error desconocido"}`,
      );
    }
  }

  console.error("[comida/ia] fallaron todos los modelos", errores);
  throw new ErrorIA(
    "La IA no pudo generar una respuesta válida. Probá de nuevo en un rato.",
    errores,
  );
}

/* ── Prompts ──────────────────────────────────────────────────────────── */

const SISTEMA_COCINA = `Sos un chef argentino que cocina en Río Cuarto, Córdoba.
Hablás en español rioplatense (voseo), sin exageraciones ni palabras de relleno.
Usás ingredientes que se consiguen en cualquier almacén, verdulería o supermercado de Río Cuarto.
Sos preciso: cada ingrediente lleva cantidad numérica y unidad (g, kg, ml, l, unidad, atado, lata, cucharada).
Los pasos explican fuego, tiempos y técnica, en orden, sin agrupar todo en un solo paso.
Devolvés siempre JSON válido, sin texto antes ni después, sin bloques de código.`;

const SISTEMA_BAR = `Sos un bartender argentino que prepara tragos en Río Cuarto, Córdoba.
Hablás en español rioplatense (voseo), con criterio de barra y medidas exactas en mililitros, onzas o dashes.
Usás insumos que se consiguen en Río Cuarto y solo las herramientas que el usuario declara tener.
Indicás vaso, hielo, técnica (directo, batido, refrescado) y garnish.
Devolvés siempre JSON válido, sin texto antes ni después, sin bloques de código.`;

function listarDisponibles(disponibles: IngredienteDisponible[]) {
  if (disponibles.length === 0) return "Despensa sin ingredientes seleccionados.";
  return disponibles
    .map(
      (ingrediente) =>
        `- ${ingrediente.nombre} (${ingrediente.cantidad ?? "sin stock"} ${
          ingrediente.unidad
        })`,
    )
    .join("\n");
}

function instruccionesTono(tono: TonoReceta) {
  switch (tono) {
    case "rapido":
      return "Tiene que resolverse en 25 minutos o menos, con pocos pasos y mínimos utensilios.";
    case "elaborado":
      return "Puede llevar más tiempo y técnica: incluí pasos detallados, reposos, temperaturas y emplatado.";
    default:
      return "Cotidiano y sin técnica complicada, pero con buen sabor y pasos claros.";
  }
}

export async function generarReceta(contexto: ContextoReceta) {
  const esTrago = contexto.modo === "trago";
  const sistema = esTrago ? SISTEMA_BAR : SISTEMA_COCINA;
  const tipo = esTrago ? "trago" : contexto.tipo;

  const extras = contexto.permitirExtras
    ? `Podés sumar hasta ${IA_MAX_EXTRAS} ingredientes que no estén en la lista, siempre que sean fáciles de conseguir en Río Cuarto y los marques con "opcional": true.`
    : "Usá exclusivamente los ingredientes de la lista. No agregues ningún otro ingrediente, ni siquiera sal, aceite o agua, salvo que estén listados.";

  const evitar =
    contexto.evitar.length > 0
      ? `No repitas estos platos que el usuario ya tiene guardados: ${contexto.evitar
          .slice(0, 12)
          .join(", ")}.`
      : "";

  const utiles = esTrago
    ? `Herramientas de barra disponibles: ${
        contexto.utensilios.length > 0
          ? contexto.utensilios.join(", ")
          : "ninguna declarada"
      }. No uses herramientas que no estén en esa lista.`
    : "";

  const nota = contexto.nota
    ? `Pedido extra del usuario: ${contexto.nota}`
    : "";

  const forma = esTrago
    ? `{"titulo":"","tipo":"trago","tono":"${contexto.tono}","minutos":5,"porciones":1,"ingredientes":[{"nombre":"","cantidad":"60 ml","detalle":"","opcional":false}],"pasos":["","",""],"tips":"","nutricion":{"kcal":0,"proteinas":0,"carbos":0,"grasas":0},"herramientas":[""],"vaso":"","tecnica":""}`
    : `{"titulo":"","tipo":"${tipo}","tono":"${contexto.tono}","minutos":30,"porciones":2,"ingredientes":[{"nombre":"","cantidad":"500 g","detalle":"","opcional":false}],"pasos":["","",""],"tips":"","nutricion":{"kcal":0,"proteinas":0,"carbos":0,"grasas":0}}`;

  const pedido = [
    `Prepará ${
      contexto.sorprender
        ? `una propuesta original para ${etiquetaTipoReceta(tipo)}`
        : `una receta de ${etiquetaTipoReceta(tipo)}`
    } con tono ${etiquetaTono(contexto.tono).toLowerCase()}.`,
    instruccionesTono(contexto.tono),
    contexto.minutos
      ? `Tiempo máximo total: ${contexto.minutos} minutos.`
      : "",
    `Porciones: ${contexto.porciones}.`,
    `Ingredientes disponibles:\n${listarDisponibles(contexto.disponibles)}`,
    extras,
    utiles,
    evitar,
    nota,
    esTrago
      ? "Incluí medidas exactas, cantidad de hielo, tipo de vaso, técnica y garnish. La nutrición es por trago."
      : "La nutrición es estimada por porción y en números redondos.",
    "Mínimo 3 pasos. Todos los ingredientes con cantidad. Nada de 'a gusto' salvo especias.",
    `Devolvé SOLO este JSON, con todos los campos: ${forma}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const crudo = await generarJson(
    sistema,
    pedido,
    recetaSchema,
    contexto.sorprender ? 0.85 : 0.45,
  );

  const ingredientes: IngredienteReceta[] = crudo.ingredientes.map(
    (ingrediente) => {
      const cantidadTexto =
        ingrediente.cantidad === null || ingrediente.cantidad === undefined
          ? ""
          : String(ingrediente.cantidad);
      const { cantidad, unidad } = cantidadTexto
        ? parsearCantidad(cantidadTexto)
        : { cantidad: null, unidad: "unidad" };

      return {
        nombre: ingrediente.nombre.trim(),
        cantidad,
        unidad,
        detalle: ingrediente.detalle?.trim() || null,
        opcional: ingrediente.opcional ?? false,
        ingredienteId: null,
      };
    },
  );

  const receta: RecetaGenerada = {
    titulo: crudo.titulo.trim(),
    tipo,
    tono: contexto.tono,
    minutos: crudo.minutos,
    porciones: esTrago ? 1 : crudo.porciones,
    ingredientes,
    pasos: crudo.pasos.map((paso) => paso.trim()),
    tips: crudo.tips?.trim() || null,
    nutricion: crudo.nutricion ?? null,
    herramientas: esTrago
      ? (crudo.herramientas ?? []).map((item) => item.trim()).filter(Boolean)
      : [],
    vaso: esTrago ? crudo.vaso?.trim() || null : null,
    tecnica: esTrago ? crudo.tecnica?.trim() || null : null,
  };

  return receta;
}

/* ── Menú semanal ─────────────────────────────────────────────────────── */

export async function generarMenu(contexto: ContextoMenu) {
  const momentos = contexto.momentos;
  const formaSlot = Object.fromEntries(
    momentos.map((momento) => [
      momento,
      { titulo: "", minutos: 30, ingredientes: ["", ""], reutiliza: "" },
    ]),
  );

  const pedido = [
    `Armá un menú semanal para estas fechas: ${contexto.dias.join(", ")}.`,
    `Para cada fecha incluí exactamente estos momentos: ${momentos.join(", ")}.`,
    "Platos argentinos, simples y realistas para cocinar después del trabajo. Nada de ingredientes exóticos.",
    "Aprovechá sobras entre días y evitemos repetir el mismo plato principal en la semana.",
    `Despensa disponible:\n${listarDisponibles(contexto.disponibles)}`,
    contexto.recetas.length > 0
      ? `Recetas que ya tiene guardadas y puede repetir: ${contexto.recetas
          .slice(0, 20)
          .join(", ")}.`
      : "",
    contexto.yaPlanificado.length > 0
      ? `Ya están planificados estos platos, no los repitas: ${contexto.yaPlanificado
          .map((slot) => `${slot.dia} ${slot.titulo}`)
          .join("; ")}.`
      : "",
    contexto.nota ? `Pedido extra del usuario: ${contexto.nota}` : "",
    "Cada plato necesita al menos 2 ingredientes. Si un plato reutiliza algo de otro día, indicalo en `reutiliza`; si no, dejalo vacío.",
    `Devolvé SOLO JSON con esta forma: {"dias":[{"fecha":"${contexto.dias[0]}",${JSON.stringify(
      formaSlot,
    ).slice(1)}]}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const crudo = await generarJson(
    SISTEMA_COCINA,
    pedido,
    menuSchema,
    0.6,
  );

  const dias: DiaMenuGenerado[] = contexto.dias.map((fecha, indice) => {
    const dia = crudo.dias[indice] ?? {};
    const slots: Partial<Record<MomentoMenu, SlotMenuGenerado>> = {};

    for (const momento of momentos) {
      const slot = slotMenuSchema.safeParse(dia[momento]);
      if (!slot.success) continue;
      slots[momento] = {
        titulo: slot.data.titulo.trim(),
        minutos: slot.data.minutos ?? null,
        ingredientes: (slot.data.ingredientes ?? []).map((item) => item.trim()),
        reutiliza: slot.data.reutiliza?.trim() || null,
      };
    }

    return { fecha, slots };
  });

  const generados = dias.filter(
    (dia) => Object.keys(dia.slots).length > 0,
  ).length;

  if (generados === 0) {
    throw new ErrorIA(
      "La IA no devolvió un menú usable. Probá de nuevo o cargalo a mano.",
    );
  }

  return dias;
}
