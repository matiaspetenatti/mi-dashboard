"use server";

import { requireAuthorizedUser } from "@/lib/auth";

import { db } from "@/db";
import { cuentas, movimientos, tiposCuenta } from "./schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { fechaHoy, sumarFecha } from "@/lib/format";
import { categorias } from "./categorias";
import { prepararFinanzas, reconciliarRendimientos } from "./rendimientos";
import { getMovimientosPaginados } from "./queries";
import { FINANZAS_TAG } from "./cache-tags";
import { categoriasFinanzas } from "./schema";

// Helper para parsear montos en formato argentino (ej: "1.500,50" o "1500")
const parseMontoToCentavos = (val: unknown) => {
  if (typeof val !== "string") return 0;
  const limpio = val.trim().replace(/\./g, "").replace(",", ".");
  const num = Number(limpio);
  return isNaN(num) ? 0 : Math.round(num * 100);
};

const invalidarCacheFinanzas = () => {
  updateTag(FINANZAS_TAG);
};

const cuentaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es requerido").max(50),
  tipo: z.enum(tiposCuenta),
  color: z.string().trim().default("#3b82f6"),
  rendimientoAnual: z.coerce.number().min(0).max(1000).default(0),
  saldoInicial: z.string().optional(),
  calcularAyer: z.coerce.boolean().optional(),
});

export async function crearCuenta(formData: FormData) {
  await requireAuthorizedUser();
  const parsed = cuentaSchema.safeParse({
    nombre: formData.get("nombre"),
    tipo: formData.get("tipo"),
    color: formData.get("color") || undefined,
    rendimientoAnual: formData.get("rendimientoAnual") || 0,
    saldoInicial: formData.get("saldoInicial") || undefined,
    calcularAyer: formData.get("calcularAyer") === "true" || formData.get("calcularAyer") === "on",
  });

  if (!parsed.success) {
    console.error("Error al validar cuenta:", parsed.error);
    return { error: "Datos de cuenta inválidos" };
  }

  const { nombre, tipo, color, rendimientoAnual, saldoInicial, calcularAyer } = parsed.data;
  const hoy = fechaHoy();
  const ayer = sumarFecha(hoy, "dia", -1);
  const anteayer = sumarFecha(hoy, "dia", -2);

  // Si se solicita calcular rendimiento de ayer, fijamos la última fecha calculada en anteayer
  const fechaUltimoRendimiento = calcularAyer && rendimientoAnual > 0 ? anteayer : ayer;

  const [nuevaCuenta] = await db
    .insert(cuentas)
    .values({
      nombre,
      tipo,
      color,
      rendimientoAnual,
      ultimoRendimientoFecha: fechaUltimoRendimiento,
    })
    .returning();

  if (nuevaCuenta && saldoInicial) {
    const centavos = parseMontoToCentavos(saldoInicial);
    if (centavos > 0) {
      // Si se quiere calcular ayer, el saldo inicial se fecha en ayer (o anteayer)
      const fechaSaldo = calcularAyer ? ayer : hoy;
      await db.insert(movimientos).values({
        cuentaId: nuevaCuenta.id,
        tipo: "ingreso",
        monto: centavos,
        categoria: "Otros",
        descripcion: "Saldo inicial",
        fecha: fechaSaldo,
      });
    }
  }

  if (rendimientoAnual > 0) {
    await reconciliarRendimientos();
  }

  invalidarCacheFinanzas();
  revalidatePath("/finanzas");
  revalidatePath("/");
  return { success: true };
}

const editarCuentaSchema = z.object({
  id: z.coerce.number().int().positive(),
  nombre: z.string().trim().min(1).max(50),
  tipo: z.enum(tiposCuenta),
  color: z.string().trim().default("#3b82f6"),
  rendimientoAnual: z.coerce.number().min(0).max(1000).default(0),
});

export async function actualizarCuenta(formData: FormData) {
  await requireAuthorizedUser();
  const parsed = editarCuentaSchema.safeParse({
    id: formData.get("id"),
    nombre: formData.get("nombre"),
    tipo: formData.get("tipo"),
    color: formData.get("color") || undefined,
    rendimientoAnual: formData.get("rendimientoAnual") || 0,
  });

  if (!parsed.success) {
    return { error: "Datos inválidos para actualizar cuenta" };
  }

  const { id, nombre, tipo, color, rendimientoAnual } = parsed.data;

  await db
    .update(cuentas)
    .set({
      nombre,
      tipo,
      color,
      rendimientoAnual,
    })
    .where(eq(cuentas.id, id));

  if (rendimientoAnual > 0) {
    await reconciliarRendimientos();
  }

  invalidarCacheFinanzas();
  revalidatePath("/finanzas");
  revalidatePath("/");
  return { success: true };
}

export async function borrarCuenta(id: number) {
  await requireAuthorizedUser();
  // Primero eliminamos los movimientos de la cuenta
  await db.delete(movimientos).where(eq(movimientos.cuentaId, id));
  // Luego la cuenta
  await db.delete(cuentas).where(eq(cuentas.id, id));

  invalidarCacheFinanzas();
  revalidatePath("/finanzas");
  revalidatePath("/");
  return { success: true };
}

const movimientoSchema = z.object({
  cuentaId: z.coerce.number().int().positive(),
  tipo: z.enum(["ingreso", "gasto"]),
  monto: z
    .string()
    .trim()
    .transform((v) => {
      const cleaned = v.replace(/\./g, "").replace(",", ".");
      return Number(cleaned);
    })
    .pipe(z.number().positive().max(1_000_000_000))
    .transform((n) => Math.round(n * 100)),
  categoria: z.string().trim().min(1),
  descripcion: z.string().trim().max(200).optional(),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export async function crearMovimiento(formData: FormData) {
  await requireAuthorizedUser();
  const parsed = movimientoSchema.safeParse({
    cuentaId: formData.get("cuentaId"),
    tipo: formData.get("tipo"),
    monto: formData.get("monto"),
    categoria: formData.get("categoria"),
    descripcion: formData.get("descripcion") || undefined,
    fecha: formData.get("fecha") || undefined,
  });

  if (!parsed.success) {
    console.error("Error validación movimiento:", parsed.error);
    return { error: "Datos del movimiento inválidos" };
  }

  const { fecha, ...resto } = parsed.data;
  await db.insert(movimientos).values({
    ...resto,
    fecha: fecha ?? fechaHoy(),
  });

  invalidarCacheFinanzas();
  revalidatePath("/finanzas");
  revalidatePath("/");
  return { success: true };
}

export async function borrarMovimiento(id: number) {
  await requireAuthorizedUser();
  await db.delete(movimientos).where(eq(movimientos.id, id));
  invalidarCacheFinanzas();
  revalidatePath("/finanzas");
  revalidatePath("/");
}

const editarMovimientoSchema = z.object({
  id: z.coerce.number().int().positive(),
  cuentaId: z.coerce.number().int().positive(),
  tipo: z.enum(["ingreso", "gasto"]),
  monto: z
    .string()
    .trim()
    .transform((v) => Number(v.replace(/\./g, "").replace(",", ".")))
    .pipe(z.number().positive().max(1_000_000_000))
    .transform((n) => Math.round(n * 100)),
  categoria: z.string().trim().min(1),
  descripcion: z.string().trim().max(200).optional(),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export async function actualizarMovimiento(formData: FormData) {
  await requireAuthorizedUser();
  const parsed = editarMovimientoSchema.safeParse({
    id: formData.get("id"),
    cuentaId: formData.get("cuentaId"),
    tipo: formData.get("tipo"),
    monto: formData.get("monto"),
    categoria: formData.get("categoria"),
    descripcion: formData.get("descripcion") || undefined,
    fecha: formData.get("fecha") || undefined,
  });

  if (!parsed.success) {
    console.error("Error validación editar movimiento:", parsed.error);
    return { error: "Datos del movimiento inválidos" };
  }

  const { id, fecha, descripcion, ...resto } = parsed.data;
  await db
    .update(movimientos)
    .set({
      ...resto,
      descripcion: descripcion ?? null,
      fecha: fecha ?? fechaHoy(),
    })
    .where(eq(movimientos.id, id));

  invalidarCacheFinanzas();
  revalidatePath("/finanzas");
  revalidatePath("/");
  return { success: true };
}

const transferenciaSchema = z.object({
  cuentaOrigenId: z.coerce.number().int().positive(),
  cuentaDestinoId: z.coerce.number().int().positive(),
  monto: z
    .string()
    .trim()
    .transform((v) => Number(v.replace(/./g, "").replace(",", ".")))
    .pipe(z.number().positive().max(1_000_000_000))
    .transform((n) => Math.round(n * 100)),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  descripcion: z.string().trim().max(200).optional(),
});

export async function transferirEntreCuentas(formData: FormData) {
  await requireAuthorizedUser();
  const parsed = transferenciaSchema.safeParse({
    cuentaOrigenId: formData.get("cuentaOrigenId"),
    cuentaDestinoId: formData.get("cuentaDestinoId"),
    monto: formData.get("monto"),
    fecha: formData.get("fecha") || undefined,
    descripcion: formData.get("descripcion") || undefined,
  });

  if (!parsed.success) {
    return { error: "Datos de transferencia inválidos" };
  }

  const { cuentaOrigenId, cuentaDestinoId, monto, fecha, descripcion } = parsed.data;

  if (cuentaOrigenId === cuentaDestinoId) {
    return { error: "La cuenta de origen y destino deben ser distintas" };
  }

  const [cuentaOrigen] = await db.select().from(cuentas).where(eq(cuentas.id, cuentaOrigenId));
  const [cuentaDestino] = await db.select().from(cuentas).where(eq(cuentas.id, cuentaDestinoId));

  const fechaFinal = fecha ?? fechaHoy();
  const descOrigen = descripcion
    ? `Transferencia a ${cuentaDestino?.nombre ?? "otra cuenta"}: ${descripcion}`
    : `Transferencia a ${cuentaDestino?.nombre ?? "otra cuenta"}`;

  const descDestino = descripcion
    ? `Transferencia desde ${cuentaOrigen?.nombre ?? "otra cuenta"}: ${descripcion}`
    : `Transferencia desde ${cuentaOrigen?.nombre ?? "otra cuenta"}`;

  // Gasto en origen
  await db.insert(movimientos).values({
    cuentaId: cuentaOrigenId,
    tipo: "gasto",
    monto,
    categoria: "Transferencia",
    descripcion: descOrigen,
    fecha: fechaFinal,
  });

  // Ingreso en destino
  await db.insert(movimientos).values({
    cuentaId: cuentaDestinoId,
    tipo: "ingreso",
    monto,
    categoria: "Transferencia",
    descripcion: descDestino,
    fecha: fechaFinal,
  });

  invalidarCacheFinanzas();
  revalidatePath("/finanzas");
  revalidatePath("/");
  return { success: true };
}

export async function sincronizarRendimientosAction() {
  await requireAuthorizedUser();
  const result = await prepararFinanzas();
  invalidarCacheFinanzas();
  revalidatePath("/finanzas");
  revalidatePath("/");
  return result;
}

const ajustarSaldoSchema = z.object({
  cuentaId: z.coerce.number().int().positive(),
  nuevoSaldo: z
    .string()
    .trim()
    .transform((v) => Number(v.replace(/\./g, "").replace(",", ".")))
    .pipe(z.number().finite()),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  descripcion: z.string().trim().max(200).optional(),
});

export async function ajustarSaldoCuenta(formData: FormData) {
  await requireAuthorizedUser();
  const parsed = ajustarSaldoSchema.safeParse({
    cuentaId: formData.get("cuentaId"),
    nuevoSaldo: formData.get("nuevoSaldo"),
    fecha: formData.get("fecha") || undefined,
    descripcion: formData.get("descripcion") || undefined,
  });

  if (!parsed.success) {
    return { error: "Datos inválidos para ajustar el saldo" };
  }

  const { cuentaId, nuevoSaldo, fecha, descripcion } = parsed.data;
  const nuevoSaldoCentavos = Math.round(nuevoSaldo * 100);

  const [cuenta] = await db.select().from(cuentas).where(eq(cuentas.id, cuentaId));
  if (!cuenta) {
    return { error: "Cuenta no encontrada" };
  }

  const [res] = await db
    .select({
      ingresos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'ingreso' then ${movimientos.monto} end), 0)`,
      gastos: sql<number>`coalesce(sum(case when ${movimientos.tipo} = 'gasto' then ${movimientos.monto} end), 0)`,
    })
    .from(movimientos)
    .where(eq(movimientos.cuentaId, cuentaId));

  const saldoActualCentavos = Number(res?.ingresos ?? 0) - Number(res?.gastos ?? 0);
  const deltaCentavos = nuevoSaldoCentavos - saldoActualCentavos;

  if (deltaCentavos === 0) {
    return { success: true, sinCambios: true };
  }

  const fechaAjuste = fecha ?? fechaHoy();
  const descripcionAjuste = descripcion?.trim() || "Ajuste de saldo";

  if (deltaCentavos > 0) {
    await db.insert(movimientos).values({
      cuentaId,
      tipo: "ingreso",
      monto: deltaCentavos,
      categoria: "Ajuste",
      descripcion: descripcionAjuste,
      fecha: fechaAjuste,
    });
  } else {
    await db.insert(movimientos).values({
      cuentaId,
      tipo: "gasto",
      monto: Math.abs(deltaCentavos),
      categoria: "Ajuste",
      descripcion: descripcionAjuste,
      fecha: fechaAjuste,
    });
  }

  if (cuenta.rendimientoAnual > 0) {
    await reconciliarRendimientos();
  }

  invalidarCacheFinanzas();
  revalidatePath("/finanzas");
  revalidatePath("/");
  return { success: true };
}

export async function obtenerMovimientosPaginadosAction(params: {
  pagina?: number;
  limite?: number;
  cuentaId?: number;
  tipo?: "ingreso" | "gasto" | "todos" | "rendimiento";
  categoria?: string;
  categoriaPadre?: string;
  ocultarRendimientos?: boolean;
}) {
  await requireAuthorizedUser();
  return await getMovimientosPaginados(params);
}

const crearCategoriaSchema = z.object({
  nombre: z.string().trim().min(1).max(50),
  tipo: z.enum(["ingreso", "gasto"]),
  icono: z.string().trim().min(1).max(30).default("Tag"),
  parentId: z.coerce.number().int().positive().optional(),
  orden: z.coerce.number().int().min(0).default(0),
});

export async function crearCategoriaFinanza(formData: FormData) {
  await requireAuthorizedUser();
  const parsed = crearCategoriaSchema.safeParse({
    nombre: formData.get("nombre"),
    tipo: formData.get("tipo"),
    icono: formData.get("icono") || "Tag",
    parentId: formData.get("parentId") || undefined,
    orden: formData.get("orden") || 0,
  });

  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const { nombre, tipo, icono, parentId, orden } = parsed.data;

  await db.insert(categoriasFinanzas).values({
    nombre,
    tipo,
    icono,
    parentId: parentId ?? null,
    orden,
    activo: true,
    esSistema: false,
  });

  invalidarCacheFinanzas();
  revalidatePath("/finanzas");
  revalidatePath("/");
  return { success: true };
}

const actualizarCategoriaSchema = z.object({
  id: z.coerce.number().int().positive(),
  nombre: z.string().trim().min(1).max(50),
  icono: z.string().trim().min(1).max(30).default("Tag"),
  orden: z.coerce.number().int().min(0).default(0),
  activo: z.coerce.boolean().optional(),
});

export async function actualizarCategoriaFinanza(formData: FormData) {
  await requireAuthorizedUser();
  const parsed = actualizarCategoriaSchema.safeParse({
    id: formData.get("id"),
    nombre: formData.get("nombre"),
    icono: formData.get("icono") || "Tag",
    orden: formData.get("orden") || 0,
    activo: formData.get("activo"),
  });

  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  const { id, nombre, icono, orden, activo } = parsed.data;

  await db
    .update(categoriasFinanzas)
    .set({
      nombre,
      icono,
      orden,
      activo: activo ?? true,
    })
    .where(eq(categoriasFinanzas.id, id));

  invalidarCacheFinanzas();
  revalidatePath("/finanzas");
  revalidatePath("/");
  return { success: true };
}

export async function eliminarCategoriaFinanza(id: number) {
  await requireAuthorizedUser();
  const cat = await db.select({ nombre: categoriasFinanzas.nombre }).from(categoriasFinanzas).where(eq(categoriasFinanzas.id, id));
  const nombreCat = cat[0]?.nombre ?? "";

  const countRows = await db
    .select({ total: sql<number>`count(*)` })
    .from(movimientos)
    .where(eq(movimientos.categoria, nombreCat));

  if (Number(countRows[0]?.total ?? 0) > 0) {
    await db.update(categoriasFinanzas).set({ activo: false }).where(eq(categoriasFinanzas.id, id));
  } else {
    await db.delete(categoriasFinanzas).where(eq(categoriasFinanzas.id, id));
  }

  invalidarCacheFinanzas();
  revalidatePath("/finanzas");
  revalidatePath("/");
  return { success: true };
}

