import { createFileRoute } from "@tanstack/react-router"

import { ChartCard } from "@/components/organisms/chart-card"
import { PageHeader } from "@/components/organisms/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChartDemo } from "@/features/design/chart-demo"

export const Route = createFileRoute("/_app/diseno")({
  component: DisenoPage,
})

const colores = [
  { nombre: "Forest Ink", valor: "#163300", clase: "bg-forest-ink" },
  { nombre: "Lime Voltage", valor: "#9FE870", clase: "bg-lime-voltage" },
  { nombre: "Spruce", valor: "#054D28", clase: "bg-spruce" },
  { nombre: "Linen Mist", valor: "#E2F6D5", clase: "bg-linen-mist" },
  { nombre: "Signal Blue", valor: "#0B4C72", clase: "bg-signal-blue" },
  { nombre: "Alarm Red", valor: "#CB272F", clase: "bg-alarm-red" },
]

function DisenoPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="QA interno"
        title="Design system"
        description="Tokens Wise, componentes base y validación de TanStack Charts con SSR."
      />

      <section className="rounded-3xl border border-outline-variant/60 bg-card p-6 shadow-elevation-1">
        <h2 className="mb-4 text-sm font-black text-heading">Paleta</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {colores.map((color) => (
            <div key={color.nombre} className="space-y-2">
              <div
                className={`h-16 rounded-2xl border border-outline-variant/40 ${color.clase}`}
              />
              <div>
                <p className="text-[11px] font-bold text-heading">{color.nombre}</p>
                <p className="text-[10px] text-muted-foreground">{color.valor}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-outline-variant/60 bg-card p-6 shadow-elevation-1">
        <h2 className="mb-4 text-sm font-black text-heading">Tipografía y controles</h2>
        <p className="text-display text-4xl text-heading">Buen día</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Inter para todo el sistema. Display en 900 con tracking negativo; el
          cuerpo usa 400–700 para mantener la lectura cómoda.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button>Acción primaria</Button>
          <Button variant="outline">Acción secundaria</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructiva</Button>
          <Badge>Etiqueta</Badge>
          <Badge variant="secondary">Secundaria</Badge>
        </div>
      </section>

      <ChartCard
        title="TanStack Charts · SSR"
        subtitle="Ejemplo de área + línea con datos determinísticos"
      >
        <ChartDemo />
      </ChartCard>
    </div>
  )
}
