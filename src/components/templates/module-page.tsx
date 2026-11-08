import type { LucideIcon } from "lucide-react"

import { ModulePlaceholder } from "@/components/organisms/module-placeholder"
import { PageHeader } from "@/components/organisms/page-header"

export function ModulePage({
  eyebrow,
  title,
  description,
  icon,
  features,
}: {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
  features: Array<string>
}) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      <ModulePlaceholder
        icon={icon}
        title="Módulo en construcción"
        description="La estructura, los datos y las acciones de este módulo llegan en la próxima fase. Mientras tanto, el resumen ya está disponible en Inicio."
        features={features}
      />
    </div>
  )
}
