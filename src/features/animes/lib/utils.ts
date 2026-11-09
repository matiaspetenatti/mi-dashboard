const etiquetasTemporada = {
  verano: "Verano",
  otono: "Otoño",
  invierno: "Invierno",
  primavera: "Primavera",
} as const

type TemporadaSur = keyof typeof etiquetasTemporada

function crearTemporada(temporada: TemporadaSur, anio: number) {
  return {
    key: `${temporada}-${anio}`,
    label: `${etiquetasTemporada[temporada]} ${anio}`,
    temporada,
    anio,
  }
}

/**
 * Temporada del hemisferio sur a partir de la fecha de emisión:
 * diciembre-febrero verano, marzo-mayo otoño, junio-agosto invierno
 * y septiembre-noviembre primavera.
 *
 * Diciembre se agrupa con el verano del año siguiente para que
 * diciembre 2024, enero 2025 y febrero 2025 compartan "Verano 2025".
 */
export function obtenerTemporadaAnime(fechaEmision?: string | null) {
  if (!fechaEmision) return null
  const fecha = fechaEmision.slice(0, 10)
  const partes = fecha.split("-")
  if (partes.length < 2) return null

  const anio = Number(partes[0])
  const mes = Number(partes[1])
  if (Number.isNaN(anio) || Number.isNaN(mes)) return null

  if (mes === 12) {
    return crearTemporada("verano", anio + 1)
  }
  if (mes === 1 || mes === 2) {
    return crearTemporada("verano", anio)
  }
  if (mes >= 3 && mes <= 5) {
    return crearTemporada("otono", anio)
  }
  if (mes >= 6 && mes <= 8) {
    return crearTemporada("invierno", anio)
  }
  if (mes >= 9 && mes <= 11) {
    return crearTemporada("primavera", anio)
  }
  return null
}
