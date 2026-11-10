import type { NutricionReceta } from "@/server/db/schema"

export const CAMPOS_NUTRICION = [
  { key: "kcal", label: "Calorías", unidad: "kcal", max: 5000 },
  { key: "proteinas", label: "Proteínas", unidad: "g", max: 500 },
  { key: "carbos", label: "Carbohidratos", unidad: "g", max: 500 },
  { key: "grasas", label: "Grasas", unidad: "g", max: 500 },
  { key: "fibra", label: "Fibra", unidad: "g", max: 100 },
  { key: "azucares", label: "Azúcares", unidad: "g", max: 100 },
  { key: "sodio", label: "Sodio", unidad: "mg", max: 5000 },
] as const

export type CampoNutricion = (typeof CAMPOS_NUTRICION)[number]["key"]
export type NutricionForm = Record<CampoNutricion, string>

export const NUTRICION_VACIA: NutricionReceta = {
  kcal: 0,
  proteinas: 0,
  carbos: 0,
  grasas: 0,
  fibra: 0,
  azucares: 0,
  sodio: 0,
}

/**
 * Completa los campos faltantes de una nutrición guardada antes de que
 * existieran todos los nutrientes. Devuelve `null` si no hay datos.
 */
export function normalizarNutricion(
  nutricion: Partial<NutricionReceta> | null | undefined,
): NutricionReceta | null {
  if (!nutricion) return null
  const total = { ...NUTRICION_VACIA }
  for (const campo of CAMPOS_NUTRICION) {
    const valor = nutricion[campo.key]
    total[campo.key] =
      typeof valor === "number" && Number.isFinite(valor) ? valor : 0
  }
  return total
}

export function nutricionFormVacia(): NutricionForm {
  return Object.fromEntries(
    CAMPOS_NUTRICION.map((campo) => [campo.key, ""]),
  ) as NutricionForm
}

export function nutricionFormDesde(
  nutricion: Partial<NutricionReceta> | null | undefined,
): NutricionForm {
  if (!nutricion) return nutricionFormVacia()
  return Object.fromEntries(
    CAMPOS_NUTRICION.map((campo) => [
      campo.key,
      nutricion[campo.key] ? String(nutricion[campo.key]) : "",
    ]),
  ) as NutricionForm
}

export function nutricionDesdeForm(form: NutricionForm): NutricionReceta {
  return Object.fromEntries(
    CAMPOS_NUTRICION.map((campo) => {
      const numero = Number(form[campo.key].replace(",", "."))
      return [campo.key, Number.isFinite(numero) ? numero : 0]
    }),
  ) as NutricionReceta
}

export function sumarNutricion(
  lista: Array<Partial<NutricionReceta> | null | undefined>,
): NutricionReceta {
  const total = { ...NUTRICION_VACIA }
  for (const nutricion of lista) {
    if (!nutricion) continue
    for (const campo of CAMPOS_NUTRICION) {
      total[campo.key] += nutricion[campo.key] || 0
    }
  }
  return total
}
