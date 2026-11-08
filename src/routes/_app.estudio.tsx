import { createFileRoute } from "@tanstack/react-router"
import { GraduationCap } from "lucide-react"

import { ModulePage } from "@/components/templates/module-page"

export const Route = createFileRoute("/_app/estudio")({
  component: EstudioPage,
})

function EstudioPage() {
  return (
    <ModulePage
      eyebrow="Carrera"
      title="Estudio"
      description="Materias, notas, exámenes y tiempo de estudio."
      icon={GraduationCap}
      features={[
        "Carreras, materias y correlatividades",
        "Notas, promedio y avance de la carrera",
        "Calendario académico y exámenes",
        "Pomodoro y registro de sesiones",
      ]}
    />
  )
}
