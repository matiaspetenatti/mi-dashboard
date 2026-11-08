import { createFileRoute } from "@tanstack/react-router"
import { Wallet } from "lucide-react"

import { ModulePage } from "@/components/templates/module-page"

export const Route = createFileRoute("/_app/finanzas")({
  component: FinanzasPage,
})

function FinanzasPage() {
  return (
    <ModulePage
      eyebrow="Patrimonio"
      title="Finanzas"
      description="Cuentas, movimientos y evolución de tu patrimonio."
      icon={Wallet}
      features={[
        "Cuentas y saldos consolidados",
        "Ingresos, gastos y categorías",
        "Evolución del patrimonio y rendimientos",
        "Comparador de servicios y movimientos recurrentes",
      ]}
    />
  )
}
