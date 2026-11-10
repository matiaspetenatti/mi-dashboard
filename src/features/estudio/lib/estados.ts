import type { Examen, Materia } from "@/server/db/schema"

import {
  etiquetasEstadoExamen,
  etiquetasEstadoMateria,
  etiquetasResultadoExamen,
  notasAprobado,
} from "../constantes"

export type EstadoVisual = {
  etiqueta: string
  clase: string
}

const claseAprobado =
  "bg-success text-on-success dark:bg-success-container dark:text-on-success-container"
const claseDesaprobado =
  "bg-error text-on-error dark:bg-error-container dark:text-on-error-container"
const claseRegular =
  "bg-warning text-on-warning dark:bg-warning-container dark:text-on-warning-container"
const claseCursando = "bg-signal-blue text-white dark:text-forest-ink"
const clasePendiente = "bg-surface-container-high text-heading"
const claseLibre =
  "bg-error text-on-error dark:bg-error-container dark:text-on-error-container"

export function estadoVisualMateria(
  materia: Pick<Materia, "estado" | "notaFinal">,
): EstadoVisual {
  if (materia.notaFinal !== null) {
    return materia.notaFinal >= notasAprobado
      ? { etiqueta: "Aprobada", clase: claseAprobado }
      : { etiqueta: "Desaprobada", clase: claseDesaprobado }
  }

  switch (materia.estado) {
    case "aprobada":
      return { etiqueta: etiquetasEstadoMateria.aprobada, clase: claseAprobado }
    case "regular":
      return { etiqueta: etiquetasEstadoMateria.regular, clase: claseRegular }
    case "cursando":
      return {
        etiqueta: etiquetasEstadoMateria.cursando,
        clase: claseCursando,
      }
    case "libre":
      return { etiqueta: etiquetasEstadoMateria.libre, clase: claseLibre }
    default:
      return {
        etiqueta: etiquetasEstadoMateria.pendiente,
        clase: clasePendiente,
      }
  }
}

export function estadoVisualExamen(
  examen: Pick<Examen, "estado" | "nota" | "resultado">,
): EstadoVisual {
  if (examen.estado === "ausente") {
    return {
      etiqueta: etiquetasEstadoExamen.ausente,
      clase: claseRegular,
    }
  }

  if (examen.nota !== null) {
    return examen.nota >= notasAprobado
      ? { etiqueta: etiquetasResultadoExamen.aprobado, clase: claseAprobado }
      : {
          etiqueta: etiquetasResultadoExamen.desaprobado,
          clase: claseDesaprobado,
        }
  }

  if (examen.resultado) {
    return examen.resultado === "aprobado"
      ? { etiqueta: etiquetasResultadoExamen.aprobado, clase: claseAprobado }
      : {
          etiqueta: etiquetasResultadoExamen.desaprobado,
          clase: claseDesaprobado,
        }
  }

  if (examen.estado === "rendido") {
    return {
      etiqueta: etiquetasEstadoExamen.rendido,
      clase: clasePendiente,
    }
  }

  return {
    etiqueta: etiquetasEstadoExamen.programado,
    clase: claseCursando,
  }
}

export function claseNota(nota: number | null): string {
  if (nota === null) return "text-heading"
  return nota >= notasAprobado ? "text-success" : "text-error"
}
