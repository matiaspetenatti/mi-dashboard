"use client"

import { useQuery } from "@tanstack/react-query"
import { Activity, Flame, GitBranch } from "lucide-react"

import { WidgetError, WidgetLoading } from "@/components/molecules/widget-states"
import { WidgetCard } from "@/components/organisms/widget-card"
import { resumenHabitosQuery } from "@/features/habitos/api"
import { cn } from "cn"

export function WidgetHabitos() {
  const { data, isPending, isError } = useQuery(resumenHabitosQuery)

  return (
    <WidgetCard
      title="Hábitos"
      subtitle="Seguimiento diario"
      href="/habitos"
      icon={Activity}
      accent="secondary"
      footer={
        <>
          <span>
            {data
              ? `${data.activos} ${
                  data.activos === 1 ? "hábito activo" : "hábitos activos"
                }`
              : "Cargando..."}
          </span>
          <span>
            {data
              ? `Racha ${data.mejorRacha} ${
                  data.mejorRacha === 1 ? "día" : "días"
                }`
              : "Rachas"}
          </span>
        </>
      }
    >
      {isPending ? <WidgetLoading /> : null}

      {isError ? (
        <WidgetError message="No se pudieron cargar los hábitos." />
      ) : null}

      {data ? (
        data.activos === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl bg-surface-container-low px-4 py-8 text-center">
            <Activity className="size-5 text-secondary" aria-hidden="true" />
            <p className="text-xs font-black text-heading">
              Sin hábitos todavía
            </p>
            <p className="text-[10px] text-muted-foreground">
              Creá tu primer hábito desde el módulo.
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex items-end gap-2">
              <span className="text-display text-5xl leading-none text-heading">
                {data.completadosHoy}
              </span>
              <span className="pb-1 text-xs font-semibold text-muted-foreground">
                de {data.activos} hoy
              </span>
            </div>

            <ul className="flex flex-col gap-1.5">
              {data.habitosHoy.slice(0, 3).map((habito) => (
                <li
                  key={habito.id}
                  className="flex items-center gap-2 rounded-xl bg-surface-container-low px-2.5 py-1.5"
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full text-[8px] font-bold",
                      habito.completado
                        ? "bg-lime-voltage text-forest-ink"
                        : "bg-card text-muted-foreground",
                    )}
                  >
                    {habito.completado ? "✓" : ""}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-heading">
                    {habito.emoji ? `${habito.emoji} ` : ""}
                    {habito.titulo}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-auto flex items-center gap-3 text-[9px] font-semibold text-muted-foreground">
              <span className="flex items-center gap-1">
                <Flame className="size-3 text-secondary" aria-hidden="true" />
                Racha {data.mejorRacha} d
              </span>
              <span className="flex items-center gap-1">
                <GitBranch className="size-3 text-secondary" aria-hidden="true" />
                {data.commitsGithub} commits
              </span>
            </div>
          </div>
        )
      ) : null}
    </WidgetCard>
  )
}
