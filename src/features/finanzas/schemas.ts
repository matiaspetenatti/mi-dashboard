import { z } from "zod"

export const tiposCuenta = [
  "billetera",
  "banco",
  "efectivo",
  "inversion",
  "otro",
] as const

export const crearMovimientoSchema = z.object({
  cuentaId: z.number().int().positive(),
  tipo: z.enum(["ingreso", "gasto"]),
  monto: z.number().int().positive("El monto debe ser mayor a cero"),
  categoria: z.string().trim().min(1, "Elegí una categoría").max(80),
  descripcion: z.string().max(300).nullable().optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
})

export const eliminarMovimientoSchema = z.object({
  id: z.number().int().positive(),
})

const cuentaBaseSchema = z.object({
  nombre: z.string().trim().min(1, "Poné un nombre").max(80),
  tipo: z.enum(tiposCuenta).default("billetera"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido")
    .default("#163300"),
  rendimientoAnual: z.number().min(0).max(1000).default(0),
})

export const crearCuentaSchema = cuentaBaseSchema.extend({
  saldoInicialCentavos: z.number().int().default(0),
})

export const actualizarCuentaSchema = cuentaBaseSchema.extend({
  id: z.number().int().positive(),
})

export const ajustarSaldoSchema = z.object({
  cuentaId: z.number().int().positive(),
  nuevoSaldoCentavos: z.number().int(),
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
    .optional(),
  descripcion: z.string().trim().max(200).nullable().optional(),
})

export const movimientosFinanzasSchema = z.object({
  pagina: z.number().int().positive().default(1),
  porPagina: z.number().int().positive().max(20).default(20),
  tipo: z.enum(["todos", "ingreso", "gasto"]).default("todos"),
  cuentaId: z.number().int().positive().nullable().default(null),
  categoria: z.string().trim().max(80).default(""),
  busqueda: z.string().trim().max(100).default(""),
  ocultarRendimientos: z.boolean().default(true),
})

export type CrearMovimientoInput = z.infer<typeof crearMovimientoSchema>
export type CrearCuentaInput = z.infer<typeof crearCuentaSchema>
export type ActualizarCuentaInput = z.infer<typeof actualizarCuentaSchema>
export type AjustarSaldoInput = z.infer<typeof ajustarSaldoSchema>
export type MovimientosFinanzasInput = z.infer<
  typeof movimientosFinanzasSchema
>

export const MOVIMIENTOS_FINANZAS_INICIALES =
  movimientosFinanzasSchema.parse({})
