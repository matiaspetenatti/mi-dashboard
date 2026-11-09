import type {
  ComparacionServicios,
  ServicioComparado,
} from "../types"

export type DefinicionServicio = {
  nombre: string
  orden: number
}

export type FilaServicioMes = {
  categoria: string
  mes: string
  total: number
}

function calcularPorcentaje(anterior: number, actual: number) {
  if (anterior <= 0) return null
  return ((actual - anterior) / anterior) * 100
}

export function construirComparacionServicios({
  servicios,
  filas,
  mesActual,
  mesAnterior,
}: {
  servicios: DefinicionServicio[]
  filas: FilaServicioMes[]
  mesActual: string
  mesAnterior: string
}): ComparacionServicios {
  const totales = new Map<
    string,
    { anterior: number | null; actual: number | null }
  >()

  for (const fila of filas) {
    const acumulado = totales.get(fila.categoria) ?? {
      anterior: null,
      actual: null,
    }

    if (fila.mes === mesAnterior) {
      acumulado.anterior = (acumulado.anterior ?? 0) + fila.total
    } else if (fila.mes === mesActual) {
      acumulado.actual = (acumulado.actual ?? 0) + fila.total
    }

    totales.set(fila.categoria, acumulado)
  }

  const ordenados = [...servicios].sort(
    (a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, "es"),
  )

  const comparados: ServicioComparado[] = ordenados.map((servicio) => {
    const total = totales.get(servicio.nombre)
    const anterior = total?.anterior ?? null
    const actual = total?.actual ?? null
    const tieneAmbos = anterior !== null && actual !== null

    return {
      categoria: servicio.nombre,
      anterior,
      actual,
      diferencia: tieneAmbos ? actual - anterior : null,
      porcentaje: tieneAmbos ? calcularPorcentaje(anterior, actual) : null,
    }
  })

  const comparables = comparados.filter(
    (servicio) => servicio.anterior !== null && servicio.actual !== null,
  )
  const totalAnterior = comparables.reduce(
    (total, servicio) => total + (servicio.anterior ?? 0),
    0,
  )
  const totalActual = comparables.reduce(
    (total, servicio) => total + (servicio.actual ?? 0),
    0,
  )

  return {
    mesAnterior,
    mesActual,
    servicios: comparados,
    totalAnterior,
    totalActual,
    diferencia:
      comparables.length > 0 ? totalActual - totalAnterior : null,
    porcentaje:
      comparables.length > 0
        ? calcularPorcentaje(totalAnterior, totalActual)
        : null,
    sinRegistrar: comparados.filter((servicio) => servicio.actual === null)
      .length,
    sinBase: comparados.filter(
      (servicio) => servicio.anterior === null && servicio.actual !== null,
    ).length,
  }
}
