import { createFileRoute } from "@tanstack/react-router"
import { CheckSquare } from "lucide-react"

import { ModulePage } from "@/components/templates/module-page"

export const Route = createFileRoute("/_app/tareas")({
  component: TareasPage,
})

function TareasPage() {
  return (
    <ModulePage
      eyebrow="Productividad"
      title="Tareas"
      description="Proyectos, pendientes y calendario en un solo lugar."
      icon={CheckSquare}
      features={[
        "Vistas lista, tablero, calendario y tabla",
        "Proyectos, estados, etiquetas y prioridades",
        "Subtareas, dependencias y comentarios",
        "Sincronización con Google Calendar",
      ]}
    />
  )
}
