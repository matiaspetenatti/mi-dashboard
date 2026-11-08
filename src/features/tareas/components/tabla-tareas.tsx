"use client"

import { CalendarDays } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fechaHoy } from "@/lib/dates"
import { colorPrioridad, esVencida, textoVencimiento } from "@/features/tareas/lib/fechas"
import type { TareaConDetalle } from "@/features/tareas/types"
import { cn } from "cn"

export function TablaTareas({
  tareas,
  onAbrir,
  onAlternar,
}: {
  tareas: TareaConDetalle[]
  onAbrir: (tarea: TareaConDetalle) => void
  onAlternar: (tarea: TareaConDetalle, completada: boolean) => void
}) {
  const hoy = fechaHoy()

  return (
    <div className="overflow-hidden rounded-3xl border border-outline-variant/60 bg-card shadow-elevation-1">
      <Table>
        <TableHeader>
          <TableRow className="bg-surface-container-low/60 hover:bg-surface-container-low/60">
            <TableHead className="w-8" />
            <TableHead className="min-w-[220px]">Tarea</TableHead>
            <TableHead>Proyecto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Vence</TableHead>
            <TableHead>Etiquetas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tareas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-xs text-muted-foreground">
                No hay tareas para mostrar.
              </TableCell>
            </TableRow>
          ) : (
            tareas.map((tarea) => {
              const completada = tarea.estado.categoria === "completado"
              const vencida = esVencida(tarea.fechaLimite) && !completada
              const textoFecha = textoVencimiento(tarea.fechaLimite)

              return (
                <TableRow
                  key={tarea.id}
                  className="cursor-pointer"
                  onClick={() => onAbrir(tarea)}
                >
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      checked={completada}
                      aria-label={completada ? "Reabrir tarea" : "Completar tarea"}
                      onCheckedChange={(checked: boolean) =>
                        onAlternar(tarea, checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-xs font-bold text-heading",
                        completada && "line-through opacity-60",
                      )}
                    >
                      {tarea.titulo}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: tarea.proyecto.color }}
                      />
                      {tarea.proyecto.nombre}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: tarea.estado.color }}
                      />
                      {tarea.estado.nombre}
                    </span>
                  </TableCell>
                  <TableCell>
                    {tarea.prioridad ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[9px] font-bold capitalize",
                          colorPrioridad(tarea.prioridad),
                        )}
                      >
                        {tarea.prioridad}
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {textoFecha ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold",
                          vencida
                            ? "bg-error-container text-error"
                            : tarea.fechaLimite === hoy
                              ? "bg-warning-container text-on-warning-container"
                              : "bg-surface-container text-muted-foreground",
                        )}
                      >
                        <CalendarDays className="size-2.5" aria-hidden="true" />
                        {textoFecha}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {tarea.etiquetas.map((etiqueta) => (
                        <span
                          key={etiqueta.id}
                          className="rounded-full px-1.5 py-0.5 text-[8px] font-bold"
                          style={{
                            backgroundColor: `${etiqueta.color}1f`,
                            color: etiqueta.color,
                          }}
                        >
                          {etiqueta.nombre}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
