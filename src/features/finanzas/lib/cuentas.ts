export const CATEGORIA_AJUSTE = "Ajuste"

export function calcularRendimientoDiarioCentavos(
  saldoCentavos: number,
  tnaPorcentaje: number,
): number {
  if (saldoCentavos <= 0 || tnaPorcentaje <= 0) return 0
  return Math.round((saldoCentavos * (tnaPorcentaje / 100)) / 365)
}

export type ResultadoAjusteSaldo = {
  diferencia: number
  tipo: "ingreso" | "gasto" | null
  monto: number
}

export function calcularAjusteSaldo({
  saldoActualCentavos,
  nuevoSaldoCentavos,
}: {
  saldoActualCentavos: number
  nuevoSaldoCentavos: number
}): ResultadoAjusteSaldo {
  const diferencia =
    Math.round(nuevoSaldoCentavos) - Math.round(saldoActualCentavos)

  if (diferencia === 0) {
    return { diferencia: 0, tipo: null, monto: 0 }
  }

  return {
    diferencia,
    tipo: diferencia > 0 ? "ingreso" : "gasto",
    monto: Math.abs(diferencia),
  }
}
