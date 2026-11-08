"use client"

import {
  CalendarDays,
  CheckCircle2,
  ListTodo,
  TriangleAlert,
} from "lucide-react"

import { cn } from "cn"

export function ResumenTareas({
  resumen,
}: {
  resumen: {
    pendientes: number
    completadas: number
    hoy: number
    vencidas: number
  }
}) {
  const items = [
    {
      label: "Pendientes",
      value: resumen.pendientes,
      icon: ListTodo,
      className: "text-heading",
    },
    {
      label: "Para hoy",
      value: resumen.hoy,
      icon: CalendarDays,
      className: "text-signal-blue",
    },
    {
      label: "Vencidas",
      value: resumen.vencidas,
      icon: TriangleAlert,
      className: "text-error",
    },
    {
      label: "Completadas",
      value: resumen.completadas,
      icon: CheckCircle2,
      className: "text-success",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.label}
            className="flex items-center gap-2.5 rounded-2xl border border-outline-variant/50 bg-card px-3 py-2.5"
          >
            <Icon className={cn("size-4 shrink-0", item.className)} aria-hidden="true" />
            <div className="min-w-0">
              <p className="tabular text-lg font-black leading-none text-heading">
                {item.value}
              </p>
              <p className="truncate text-[9px] font-semibold text-muted-foreground">
                {item.label}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
