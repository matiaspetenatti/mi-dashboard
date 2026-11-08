"use client"

import { Activity, Droplets, Monitor, Moon } from "lucide-react"

import { CorrelacionHabitosCard } from "@/features/salud/components/correlacion-habitos"
import { DiarioBienestar } from "@/features/salud/components/diario-bienestar"
import type { WorkspaceSalud } from "@/features/salud/types"
import type { RegistroDiarioSalud } from "@/server/db/schema"

function promedioDe(
  registros: RegistroDiarioSalud[],
  clave: keyof RegistroDiarioSalud,
) {
  const valores = registros
    .map((registro) => registro[clave])
    .filter((valor): valor is number => typeof valor === "number")

  if (valores.length === 0) return null
  return (
    Math.round(
      (valores.reduce((total, valor) => total + valor, 0) / valores.length) * 10,
    ) / 10
  )
}

export function VistaBienestar({ data }: { data: WorkspaceSalud }) {
  const ultimosSiete = data.diario.slice(0, 7)

  const metricas = [
    {
      icono: Moon,
      etiqueta: "Sueño promedio",
      valor: promedioDe(ultimosSiete, "horasSueno"),
      unidad: "h",
    },
    {
      icono: Droplets,
      etiqueta: "Agua promedio",
      valor: promedioDe(ultimosSiete, "vasosAgua"),
      unidad: "vasos",
    },
    {
      icono: Activity,
      etiqueta: "Estrés promedio",
      valor: promedioDe(ultimosSiete, "nivelEstres"),
      unidad: "/5",
    },
    {
      icono: Monitor,
      etiqueta: "Pantallas promedio",
      valor: promedioDe(ultimosSiete, "horasPantalla"),
      unidad: "h",
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metricas.map((metrica) => (
          <article
            key={metrica.etiqueta}
            className="rounded-3xl border border-outline-variant/60 bg-card p-4 shadow-elevation-1"
          >
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              <metrica.icono className="size-4 text-secondary" aria-hidden="true" />
              <span className="truncate">{metrica.etiqueta}</span>
            </div>
            <p className="tabular mt-3 text-2xl font-black leading-none text-heading">
              {metrica.valor ?? "—"}
              <span className="ml-1 text-[10px] font-semibold text-muted-foreground">
                {metrica.unidad}
              </span>
            </p>
            <p className="mt-2 text-[9px] text-muted-foreground">
              {ultimosSiete.length === 0
                ? "Sin registros"
                : `Sobre ${ultimosSiete.length} ${
                    ultimosSiete.length === 1 ? "día" : "días"
                  }`}
            </p>
          </article>
        ))}
      </section>

      <DiarioBienestar registros={data.diario} hoy={data.hoy} />

      <CorrelacionHabitosCard correlacion={data.correlacion} />
    </div>
  )
}
