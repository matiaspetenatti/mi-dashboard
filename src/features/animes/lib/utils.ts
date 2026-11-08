export function obtenerTemporadaAnime(fechaEmision?: string | null) {
  if (!fechaEmision) return null
  const fecha = fechaEmision.slice(0, 10)
  const partes = fecha.split("-")
  if (partes.length < 2) return null

  const anio = Number(partes[0])
  const mes = Number(partes[1])
  if (Number.isNaN(anio) || Number.isNaN(mes)) return null

  if (mes >= 1 && mes <= 3) {
    return {
      key: `invierno-${anio}`,
      label: `Invierno ${anio}`,
      temporada: "invierno",
      anio,
    }
  }
  if (mes >= 4 && mes <= 6) {
    return {
      key: `primavera-${anio}`,
      label: `Primavera ${anio}`,
      temporada: "primavera",
      anio,
    }
  }
  if (mes >= 7 && mes <= 9) {
    return {
      key: `verano-${anio}`,
      label: `Verano ${anio}`,
      temporada: "verano",
      anio,
    }
  }
  if (mes >= 10 && mes <= 12) {
    return {
      key: `otono-${anio}`,
      label: `Otoño ${anio}`,
      temporada: "otono",
      anio,
    }
  }
  return null
}
