import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { rejectUnauthorizedRequest } from "@/lib/auth";
import { fechaHoy } from "@/lib/format";
import { ErrorIA, generarMenu } from "@/modules/comida/lib/ia";
import { diasDeSemana, inicioSemana } from "@/modules/comida/lib/semana";
import {
  comidaIngredientes,
  comidaMenu,
  comidaRecetas,
} from "@/modules/comida/schema";

const cuerpoSchema = z.object({
  semana: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Semana inválida")
    .optional(),
  momentos: z
    .array(z.enum(["desayuno", "almuerzo", "merienda", "cena"]))
    .min(1)
    .max(4)
    .default(["almuerzo", "cena"]),
  nota: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const rechazo = await rejectUnauthorizedRequest();
  if (rechazo) return rechazo;

  const cuerpo = await request.json().catch(() => null);
  const parsed = cuerpoSchema.safeParse(cuerpo ?? {});

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Pedido inválido" },
      { status: 400 },
    );
  }

  const inicio = inicioSemana(parsed.data.semana ?? fechaHoy());
  const dias = diasDeSemana(inicio);
  const fin = dias[dias.length - 1];

  try {
    const [disponibles, recetas, planificados] = await Promise.all([
      db
        .select({
          nombre: comidaIngredientes.nombre,
          cantidad: comidaIngredientes.cantidad,
          unidad: comidaIngredientes.unidad,
        })
        .from(comidaIngredientes)
        .where(eq(comidaIngredientes.tipo, "ingrediente")),
      db
        .select({ titulo: comidaRecetas.titulo })
        .from(comidaRecetas)
        .orderBy(desc(comidaRecetas.favorita), desc(comidaRecetas.creadoEn))
        .limit(20),
      db
        .select({ dia: comidaMenu.dia, titulo: comidaMenu.titulo })
        .from(comidaMenu)
        .where(and(gte(comidaMenu.dia, inicio), lte(comidaMenu.dia, fin))),
    ]);

    const generado = await generarMenu({
      dias,
      momentos: parsed.data.momentos,
      disponibles,
      recetas: recetas.map((receta) => receta.titulo),
      yaPlanificado: planificados
        .filter(
          (slot): slot is { dia: string; titulo: string } =>
            typeof slot.titulo === "string" && slot.titulo.length > 0,
        )
        .map((slot) => ({ dia: slot.dia, titulo: slot.titulo })),
      nota: parsed.data.nota,
    });

    return NextResponse.json({ semana: inicio, dias: generado });
  } catch (error) {
    if (error instanceof ErrorIA) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    console.error("[comida] Error inesperado al generar el menú:", error);
    return NextResponse.json(
      { error: "No se pudo generar el menú. Probá de nuevo." },
      { status: 500 },
    );
  }
}
