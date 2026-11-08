import { createFileRoute } from "@tanstack/react-router"
import { CloudSun } from "lucide-react"

import { ModulePage } from "@/components/templates/module-page"

export const Route = createFileRoute("/_app/clima")({
  component: ClimaPage,
})

function ClimaPage() {
  return (
    <ModulePage
      eyebrow="Pronóstico"
      title="Clima"
      description="El clima actual y los próximos 14 días en tus lugares."
      icon={CloudSun}
      features={[
        "Ubicaciones guardadas y selector rápido",
        "Clima actual con humedad, viento, lluvia y UV",
        "Pronóstico extendido de 14 días",
        "Gráfico de máximas, mínimas y probabilidad de lluvia",
        "Detalle por hora del día seleccionado",
      ]}
    />
  )
}
