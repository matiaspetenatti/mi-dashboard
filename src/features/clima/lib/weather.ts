export type IconoClima =
  | "sol"
  | "luna"
  | "nublado"
  | "parcial"
  | "lluvia"
  | "tormenta"
  | "nieve"
  | "niebla"

export type DescripcionClima = {
  label: string
  icono: IconoClima
}

const DESCRIPCIONES: Record<number, DescripcionClima> = {
  0: { label: "Despejado", icono: "sol" },
  1: { label: "Mayormente despejado", icono: "parcial" },
  2: { label: "Parcialmente nublado", icono: "parcial" },
  3: { label: "Nublado", icono: "nublado" },
  45: { label: "Niebla", icono: "niebla" },
  48: { label: "Niebla con escarcha", icono: "niebla" },
  51: { label: "Llovizna leve", icono: "lluvia" },
  53: { label: "Llovizna moderada", icono: "lluvia" },
  55: { label: "Llovizna intensa", icono: "lluvia" },
  56: { label: "Llovizna helada", icono: "lluvia" },
  57: { label: "Llovizna helada intensa", icono: "lluvia" },
  61: { label: "Lluvia leve", icono: "lluvia" },
  63: { label: "Lluvia moderada", icono: "lluvia" },
  65: { label: "Lluvia intensa", icono: "lluvia" },
  66: { label: "Lluvia helada", icono: "lluvia" },
  67: { label: "Lluvia helada intensa", icono: "lluvia" },
  71: { label: "Nevada leve", icono: "nieve" },
  73: { label: "Nevada moderada", icono: "nieve" },
  75: { label: "Nevada intensa", icono: "nieve" },
  77: { label: "Granos de nieve", icono: "nieve" },
  80: { label: "Chaparrones leves", icono: "lluvia" },
  81: { label: "Chaparrones moderados", icono: "lluvia" },
  82: { label: "Chaparrones intensos", icono: "lluvia" },
  85: { label: "Chaparrones de nieve", icono: "nieve" },
  86: { label: "Chaparrones de nieve intensos", icono: "nieve" },
  95: { label: "Tormenta", icono: "tormenta" },
  96: { label: "Tormenta con granizo", icono: "tormenta" },
  99: { label: "Tormenta con granizo intenso", icono: "tormenta" },
}

export function describirClima(code: number): DescripcionClima {
  return DESCRIPCIONES[code] ?? { label: "Clima variable", icono: "nublado" }
}
