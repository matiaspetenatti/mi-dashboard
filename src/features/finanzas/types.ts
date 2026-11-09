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

export type ServicioComparado = {
  categoria: string
  anterior: number | null
  actual: number | null
  diferencia: number | null
  porcentaje: number | null
}

export type ComparacionServicios = {
  mesAnterior: string
  mesActual: string
  servicios: ServicioComparado[]
  totalAnterior: number
  totalActual: number
  diferencia: number | null
  porcentaje: number | null
  sinRegistrar: number
  sinBase: number
}

export type PaginaMovimientosFinanzas = {
  movimientos: MovimientoConCuenta[]
  total: number
  pagina: number
  porPagina: number
  totalPaginas: number
  categorias: string[]
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
  evolucion: PuntoEvolucion[]
  categoriasDisponibles: CategoriaFinanza[]
  servicios: ComparacionServicios
}
