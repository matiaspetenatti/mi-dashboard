import { createFileRoute } from "@tanstack/react-router"
import { UtensilsCrossed } from "lucide-react"

import { ModulePage } from "@/components/templates/module-page"

export const Route = createFileRoute("/_app/comida")({
  component: ComidaPage,
})

function ComidaPage() {
  return (
    <ModulePage
      eyebrow="Cocina"
      title="Comida"
      description="Despensa, recetario y lista de compras."
      icon={UtensilsCrossed}
      features={[
        "Despensa con cantidades y vencimientos",
        "Recetario con ingredientes y pasos",
        "Lista de compras generada desde recetas",
        "Menú semanal y control de stock",
      ]}
    />
  )
}
