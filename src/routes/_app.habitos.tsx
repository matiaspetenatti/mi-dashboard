import { createFileRoute } from "@tanstack/react-router"
import { Activity } from "lucide-react"

import { ModulePage } from "@/components/templates/module-page"

export const Route = createFileRoute("/_app/habitos")({
  component: HabitosPage,
})

function HabitosPage() {
  return (
    <ModulePage
      eyebrow="Rutina"
      title="Hábitos"
      description="Seguimiento diario, rachas y mapas de constancia."
      icon={Activity}
      features={[
        "Hábitos personalizados y frecuencia",
        "Check-in diario y rachas",
        "Heatmap de constancia",
        "Actividad de GitHub integrada",
      ]}
    />
  )
}
