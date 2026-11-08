"use client"

import { useState } from "react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { TareaConDetalle } from "@/features/tareas/types"
import { cn } from "cn"

export function CalendarioTareas({
  tareas,
  onAbrir,
  onCrearEnFecha,
}: {
  tareas: TareaConDetalle[]
  onAbrir: (tarea: TareaConDetalle) => void
  onCrearEnFecha: (fecha: string) => void
}) {
  const [mes, setMes] = useState(() => startOfMonth(new Date()))

  const inicio = startOfWeek(startOfMonth(mes), { weekStartsOn: 1 })
  const fin = endOfWeek(endOfMonth(mes), { weekStartsOn: 1 })
  const dias = eachDayOfInterval({ start: inicio, end: fin })

  const tareasPorFecha = new Map<string, TareaConDetalle[]>()
  for (const tarea of tareas) {
    if (!tarea.fechaLimite) continue
    const lista = tareasPorFecha.get(tarea.fechaLimite) ?? []
    lista.push(tarea)
    tareasPorFecha.set(tarea.fechaLimite, lista)
  }

  const etiquetasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  return (
    <div className="overflow-hidden rounded-3xl border border-outline-variant/60 bg-card shadow-elevation-1">
      <header className="flex items-center justify-between gap-2 border-b border-outline-variant/50 p-4">
        <h2 className="text-sm font-black capitalize text-heading">
          {format(mes, "MMMM yyyy", { locale: es })}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mes anterior"
            onClick={() => setMes((actual) => subMonths(actual, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-full px-3 text-[10px] font-bold"
            onClick={() => setMes(startOfMonth(new Date()))}
          >
            Hoy
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mes siguiente"
            onClick={() => setMes((actual) => addMonths(actual, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-7 border-b border-outline-variant/40 bg-surface-container-low/50">
        {etiquetasSemana.map((dia) => (
          <div
            key={dia}
            className="px-2 py-2 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground"
          >
            {dia}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {dias.map((dia) => {
          const key = format(dia, "yyyy-MM-dd")
          const tareasDia = tareasPorFecha.get(key) ?? []
          const delMes = isSameMonth(dia, mes)
          const hoy = isToday(dia)

          return (
            <div
              key={key}
              className={cn(
                "group min-h-[96px] border-b border-r border-outline-variant/30 p-1.5 last:border-r-0",
                !delMes && "bg-surface-container-low/40",
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
                    hoy
                      ? "bg-lime-voltage text-forest-ink"
                      : delMes
                        ? "text-heading"
                        : "text-muted-foreground/50",
                  )}
                >
                  {format(dia, "d")}
                </span>
                <button
                  type="button"
                  aria-label={`Crear tarea el ${key}`}
                  onClick={() => onCrearEnFecha(key)}
                  className="flex size-4 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                >
                  <Plus className="size-3" />
                </button>
              </div>

              <div className="flex flex-col gap-1">
                {tareasDia.slice(0, 2).map((tarea) => (
                  <button
                    key={tarea.id}
                    type="button"
                    onClick={() => onAbrir(tarea)}
                    className="truncate rounded-md bg-linen-mist px-1.5 py-0.5 text-left text-[8px] font-bold text-forest-ink hover:bg-lime-voltage/50 dark:bg-primary-container dark:text-lime-voltage"
                  >
                    {tarea.titulo}
                  </button>
                ))}
                {tareasDia.length > 2 ? (
                  <span className="px-1 text-[8px] font-bold text-muted-foreground">
                    +{tareasDia.length - 2} más
                  </span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
