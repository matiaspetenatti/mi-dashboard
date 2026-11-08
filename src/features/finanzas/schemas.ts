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

export const crearCuentaSchema = z.object({
  nombre: z.string().trim().min(1, "Poné un nombre").max(80),
  tipo: z.enum(tiposCuenta).default("billetera"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido")
    .default("#163300"),
  rendimientoAnual: z.number().min(0).max(1000).default(0),
})

export type CrearMovimientoInput = z.infer<typeof crearMovimientoSchema>
export type CrearCuentaInput = z.infer<typeof crearCuentaSchema>
