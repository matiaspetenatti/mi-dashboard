"use server";

import { db } from "@/db";
import { movimientos } from "./schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fechaHoy } from "@/lib/format";
import { categorias } from "./categorias";

const movimientoSchema = z.object({
  tipo: z.enum(["ingreso", "gasto"]),
  // acepta "1500" o "1.500,50" (punto = miles, coma = decimales)
  monto: z
    .string()
    .trim()
    .transform((v) => Number(v.replace(/\./g, "").replace(",", ".")))
    .pipe(z.number().positive().max(1_000_000_000))
    .transform((n) => Math.round(n * 100)),
  categoria: z.enum(categorias),
  descripcion: z.string().trim().max(200).optional(),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export async function crearMovimiento(formData: FormData) {
  const parsed = movimientoSchema.safeParse({
    tipo: formData.get("tipo"),
    monto: formData.get("monto"),
    categoria: formData.get("categoria"),
    descripcion: formData.get("descripcion") || undefined,
    fecha: formData.get("fecha") || undefined,
  });
  if (!parsed.success) return;

  const { fecha, ...resto } = parsed.data;
  await db.insert(movimientos).values({ ...resto, fecha: fecha ?? fechaHoy() });

  revalidatePath("/finanzas");
  revalidatePath("/");
}

export async function borrarMovimiento(id: number) {
  await db.delete(movimientos).where(eq(movimientos.id, id));
  revalidatePath("/finanzas");
  revalidatePath("/");
}
