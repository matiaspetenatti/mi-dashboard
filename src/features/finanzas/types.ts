import type {
  CategoriaFinanza,
  Cuenta,
  Movimiento,
} from "@/server/db/schema"

export type CuentaConSaldo = Cuenta & {
  saldo: number
  estimadoDiario: number
  estimadoMensual: number
}

export type MovimientoConCuenta = Movimiento & {
  cuenta: { id: number; nombre: string; color: string } | null
}

export type PuntoEvolucion = {
  fecha: string
  saldo: number
}

export type FinanzasWorkspace = {
  cuentas: CuentaConSaldo[]
  resumen: {
    saldoTotal: number
    ingresosMes: number
    gastosMes: number
    rendimientoDiario: number
    rendimientoMensual: number
    cantidadCuentas: number
  }
  categorias: Array<{ nombre: string; total: number }>
  movimientos: MovimientoConCuenta[]
  evolucion: PuntoEvolucion[]
  categoriasDisponibles: CategoriaFinanza[]
}
