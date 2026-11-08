import type { Habito } from "@/server/db/schema"

export type VistaHabitos = "todos" | "bueno" | "malo" | "archivados"

export const TIPOS_HABITO: Array<{
  valor: Habito["tipo"]
  etiqueta: string
  descripcion: string
  clase: string
}> = [
  {
    valor: "bueno",
    etiqueta: "Hábito bueno",
    descripcion: "Hábitos que querés construir y mantener",
    clase: "bg-success-container text-success",
  },
  {
    valor: "malo",
    etiqueta: "Hábito malo",
    descripcion: "Hábitos que querés erradicar o reducir",
    clase: "bg-error-container text-error",
  },
]

export const COLORES_HABITO: Array<{ valor: string; etiqueta: string }> = [
  { valor: "#163300", etiqueta: "Forest Ink" },
  { valor: "#054d28", etiqueta: "Spruce" },
  { valor: "#0b4c72", etiqueta: "Signal Blue" },
  { valor: "#cb272f", etiqueta: "Alarm Red" },
  { valor: "#6a6c6a", etiqueta: "Slate" },
  { valor: "#7d6a00", etiqueta: "Olive" },
]

export const DIAS_SEMANA = [
  { clave: "lun", etiqueta: "Lun" },
  { clave: "mar", etiqueta: "Mar" },
  { clave: "mie", etiqueta: "Mié" },
  { clave: "jue", etiqueta: "Jue" },
  { clave: "vie", etiqueta: "Vie" },
  { clave: "sab", etiqueta: "Sáb" },
  { clave: "dom", etiqueta: "Dom" },
]

export function etiquetaTipo(tipo: Habito["tipo"]) {
  return TIPOS_HABITO.find((item) => item.valor === tipo)?.etiqueta ?? tipo
}

export function claseTipo(tipo: Habito["tipo"]) {
  return TIPOS_HABITO.find((item) => item.valor === tipo)?.clase ?? ""
}

export const GITHUB_USUARIO = "matiaspetenatti"
