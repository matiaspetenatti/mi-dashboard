export function obtenerTemporadaAnime(fechaEmision?: string | null) {
  if (!fechaEmision) return null;
  const fecha = fechaEmision.slice(0, 10);
  const partes = fecha.split("-");
  if (partes.length < 2) return null;
  const año = Number(partes[0]);
  const mes = Number(partes[1]);
  if (Number.isNaN(año) || Number.isNaN(mes)) return null;
  if (mes >= 1 && mes <= 3) {
    return { key: `invierno-${año}`, label: `Invierno ${año}`, temporada: "invierno", año };
  }
  if (mes >= 4 && mes <= 6) {
    return { key: `primavera-${año}`, label: `Primavera ${año}`, temporada: "primavera", año };
  }
  if (mes >= 7 && mes <= 9) {
    return { key: `verano-${año}`, label: `Verano ${año}`, temporada: "verano", año };
  }
  if (mes >= 10 && mes <= 12) {
    return { key: `otoño-${año}`, label: `Otoño ${año}`, temporada: "otoño", año };
  }
  return null;
}
