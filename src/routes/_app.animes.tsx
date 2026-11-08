import { createFileRoute } from "@tanstack/react-router"
import { Tv } from "lucide-react"

import { ModulePage } from "@/components/templates/module-page"

export const Route = createFileRoute("/_app/animes")({
  component: AnimesPage,
})

function AnimesPage() {
  return (
    <ModulePage
      eyebrow="Entretenimiento"
      title="Animes"
      description="Tu catálogo, puntajes y la emisión de la temporada."
      icon={Tv}
      features={[
        "Catálogo con filtros y búsqueda",
        "Puntaje propio de 0 a 100 con criterios",
        "Estadísticas por género, año y estudio",
        "Calendario semanal de animes en emisión",
      ]}
    />
  )
}
