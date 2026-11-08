"use client"

import { CalendarDays, FolderPlus, Inbox, Layers, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ResumenProyecto, FiltroVencimiento } from "@/features/tareas/types"
import { cn } from "cn"

export function NavProyectos({
  proyectos,
  proyectoSeleccionado,
  onSeleccionar,
  onNuevoProyecto,
  filtroVencimiento,
  onFiltroVencimiento,
  resumenGlobal,
}: {
  proyectos: ResumenProyecto[]
  proyectoSeleccionado: string | null
  onSeleccionar: (slug: string | null) => void
  onNuevoProyecto: () => void
  filtroVencimiento: FiltroVencimiento
  onFiltroVencimiento: (filtro: FiltroVencimiento) => void
  resumenGlobal: { pendientes: number; hoy: number; vencidas: number }
}) {
  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
      <section className="rounded-3xl border border-outline-variant/60 bg-card p-3 shadow-elevation-1">
        <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Espacios
        </p>

        <button
          type="button"
          onClick={() => onSeleccionar(null)}
          className={cn(
            "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-colors",
            proyectoSeleccionado === null
              ? "bg-primary-container text-on-primary-container"
              : "text-muted-foreground hover:bg-muted hover:text-heading",
          )}
        >
          <Layers className="size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 truncate">Todas las tareas</span>
          <span className="tabular text-[10px] font-bold opacity-70">
            {resumenGlobal.pendientes}
          </span>
        </button>

        {proyectos.map((item) => {
          const activo = item.proyecto.slug === proyectoSeleccionado
          return (
            <button
              key={item.proyecto.id}
              type="button"
              onClick={() => onSeleccionar(item.proyecto.slug)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                activo
                  ? "bg-primary-container text-on-primary-container"
                  : "text-muted-foreground hover:bg-muted hover:text-heading",
              )}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.proyecto.color }}
              />
              <span className="min-w-0 flex-1 truncate">{item.proyecto.nombre}</span>
              {item.vencidas > 0 ? (
                <span className="flex items-center gap-1 rounded-full bg-error-container px-1.5 py-0.5 text-[9px] font-bold text-error">
                  <TriangleAlert className="size-2.5" aria-hidden="true" />
                  {item.vencidas}
                </span>
              ) : (
                <span className="tabular text-[10px] font-bold opacity-70">
                  {item.pendientes}
                </span>
              )}
            </button>
          )
        })}

        <Button
          type="button"
          variant="ghost"
          className="mt-2 h-8 w-full justify-start rounded-2xl px-3 text-[11px] font-bold text-muted-foreground"
          onClick={onNuevoProyecto}
        >
          <FolderPlus className="size-3.5" aria-hidden="true" />
          Nuevo proyecto
        </Button>
      </section>

      <section className="rounded-3xl border border-outline-variant/60 bg-card p-3 shadow-elevation-1">
        <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Vistas rápidas
        </p>
        {[
          { value: "hoy", label: "Para hoy", icon: CalendarDays, count: resumenGlobal.hoy },
          { value: "vencidas", label: "Vencidas", icon: TriangleAlert, count: resumenGlobal.vencidas },
          { value: "sin_fecha", label: "Sin fecha", icon: Inbox, count: null },
        ].map((item) => {
          const Icon = item.icon
          const activo = filtroVencimiento === item.value
          return (
            <button
              key={item.value}
              type="button"
              onClick={() =>
                onFiltroVencimiento(
                  activo ? "todas" : (item.value as FiltroVencimiento),
                )
              }
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-xs font-semibold transition-colors",
                activo
                  ? "bg-linen-mist text-forest-ink dark:bg-primary-container dark:text-lime-voltage"
                  : "text-muted-foreground hover:bg-muted hover:text-heading",
              )}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {item.count !== null ? (
                <span className="tabular text-[10px] font-bold opacity-70">
                  {item.count}
                </span>
              ) : null}
            </button>
          )
        })}
      </section>
    </aside>
  )
}
