import { createFileRoute } from "@tanstack/react-router"
import { HeartPulse } from "lucide-react"

import { ModulePage } from "@/components/templates/module-page"

export const Route = createFileRoute("/_app/salud")({
  component: SaludPage,
})

function SaludPage() {
  return (
    <ModulePage
      eyebrow="Bienestar"
      title="Salud"
      description="Registro de migraña, desencadenantes y bienestar diario."
      icon={HeartPulse}
      features={[
        "Bitácora completa de episodios de migraña",
        "Intensidad, duración, síntomas y medicación",
        "Mapa de desencadenantes y correlaciones",
        "Estadísticas e informes en PDF",
        "Registro diario de bienestar",
      ]}
    />
  )
}
