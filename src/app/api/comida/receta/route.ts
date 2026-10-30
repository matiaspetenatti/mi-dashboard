import { NextResponse, type NextRequest } from "next/server";
import { desc, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { rejectUnauthorizedRequest } from "@/lib/auth";
import { IA_MAX_INGREDIENTES } from "@/modules/comida/constantes";
import { ErrorIA, generarReceta } from "@/modules/comida/lib/ia";
import { comidaIngredientes, comidaRecetas } from "@/modules/comida/schema";

const cuerpoSchema = z.object({
  modo: z.enum(["cocina", "trago"]),
  tipo: z.enum([
    "desayuno",
    "almuerzo",
    "cena",
    "merienda",
    "postre",
    "snack",
    "trago",
  ]),
  tono: z.enum(["rapido", "sencillo", "elaborado"]),
  minutos: z.number().int().min(5).max(600).nullable(),
  porciones: z.number().int().min(1).max(24),
  ingredientesIds: z
    .array(z.number().int().positive())
    .min(1, "Elegí al menos un ingrediente")
    .max(IA_MAX_INGREDIENTES),
  permitirExtras: z.boolean(),
  sorprender: z.boolean(),
  nota: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const rechazo = await rejectUnauthorizedRequest();
  if (rechazo) return rechazo;

  const cuerpo = await request.json().catch(() => null);
  const parsed = cuerpoSchema.safeParse(cuerpo);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "Los datos del pedido no son válidos",
      },
      { status: 400 },
    );
  }

  const datos = parsed.data;

  try {
    const [seleccionados, utensilios, recetas] = await Promise.all([
      db
        .select({
          nombre: comidaIngredientes.nombre,
          cantidad: comidaIngredientes.cantidad,
          unidad: comidaIngredientes.unidad,
        })
        .from(comidaIngredientes)
        .where(inArray(comidaIngredientes.id, datos.ingredientesIds)),
      db
        .select({ nombre: comidaIngredientes.nombre })
        .from(comidaIngredientes)
        .where(
          inArray(
            comidaIngredientes.tipo,
            ["utensilio"],
          ),
        ),
      db
        .select({ titulo: comidaRecetas.titulo })
        .from(comidaRecetas)
        .orderBy(desc(comidaRecetas.creadoEn))
        .limit(12),
    ]);

    if (seleccionados.length === 0) {
      return NextResponse.json(
        { error: "Los ingredientes elegidos ya no están en la despensa" },
        { status: 400 },
      );
    }

    const receta = await generarReceta({
      modo: datos.modo,
      tipo: datos.modo === "trago" ? "trago" : datos.tipo,
      tono: datos.tono,
      minutos: datos.minutos,
      porciones: datos.modo === "trago" ? 1 : datos.porciones,
      disponibles: seleccionados,
      utensilios: utensilios.map((item) => item.nombre),
      permitirExtras: datos.permitirExtras,
      sorprender: datos.sorprender,
      evitar: recetas.map((receta) => receta.titulo),
      nota: datos.nota,
    });

    return NextResponse.json({ receta });
  } catch (error) {
    if (error instanceof ErrorIA) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    console.error("[comida] Error inesperado al generar receta:", error);
    return NextResponse.json(
      { error: "No se pudo generar la receta. Probá de nuevo." },
      { status: 500 },
    );
  }
}
