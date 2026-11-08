"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Archive,
  Check,
  Flame,
  Pencil,
  RotateCcw,
  TrendingUp,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { HeatmapHabito } from "@/features/habitos/components/heatmap-habito"
import { claseTipo, etiquetaTipo } from "@/features/habitos/constantes"
import {
  alternarActivoHabito,
  eliminarHabito,
  registrarHabito,
} from "@/features/habitos/server/functions"
import type { HabitoConEstado } from "@/features/habitos/types"
import { cn } from "cn"

export function DetalleHabito({
  habito,
  hoy,
  open,
  onOpenChange,
  onEditar,
}: {
  habito: HabitoConEstado
  hoy: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditar: () => void
}) {
  const queryClient = useQueryClient()
  const [eliminarOpen, setEliminarOpen] = useState(false)

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["habitos"] })
  }

  const registrar = useMutation({
    mutationFn: ({
      fecha,
      completado,
    }: {
      fecha: string
      completado: boolean
    }) =>
      registrarHabito({
        data: { habitoId: habito.id, fecha, completado },
      }),
    onSuccess: (_resultado, variables) => {
      invalidar()
      toast.success(
        variables.completado
          ? "Día marcado como completado"
          : "Día desmarcado",
      )
    },
    onError: () => toast.error("No se pudo guardar el registro"),
  })

  const activo = useMutation({
    mutationFn: () =>
      alternarActivoHabito({
        data: { id: habito.id, activo: !habito.activo },
      }),
    onSuccess: () => {
      invalidar()
      toast.success(habito.activo ? "Hábito archivado" : "Hábito reactivado")
    },
    onError: () => toast.error("No se pudo cambiar el estado"),
  })

  const eliminar = useMutation({
    mutationFn: () => eliminarHabito({ data: { id: habito.id } }),
    onSuccess: () => {
      invalidar()
      toast.success("Hábito eliminado")
      setEliminarOpen(false)
      onOpenChange(false)
    },
    onError: () => toast.error("No se pudo eliminar el hábito"),
  })

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-lg"
                style={{ backgroundColor: `${habito.color}22` }}
              >
                {habito.emoji ?? (habito.tipo === "bueno" ? "🟢" : "🔴")}
              </span>
              <div className="min-w-0">
                <DialogTitle className="truncate text-lg font-black tracking-tight">
                  {habito.titulo}
                </DialogTitle>
                <DialogDescription>
                  {etiquetaTipo(habito.tipo)} · {habito.frecuencia}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {habito.descripcion ? (
            <p className="rounded-2xl bg-surface-container-low px-3 py-2 text-[11px] text-muted-foreground">
              {habito.descripcion}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[9px] font-bold",
                claseTipo(habito.tipo),
              )}
            >
              {etiquetaTipo(habito.tipo)}
            </span>
            {!habito.activo ? (
              <span className="rounded-full bg-surface-container px-2.5 py-1 text-[9px] font-bold text-muted-foreground">
                Archivado
              </span>
            ) : null}
          </div>

          <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metrica
              icon={Flame}
              etiqueta="Racha actual"
              valor={`${habito.rachaActual} d`}
            />
            <Metrica
              icon={TrendingUp}
              etiqueta="Racha máxima"
              valor={`${habito.rachaMaxima} d`}
            />
            <Metrica
              icon={Check}
              etiqueta="Cumplimiento"
              valor={`${habito.porcentaje}%`}
            />
            <Metrica
              icon={RotateCcw}
              etiqueta="Registros"
              valor={String(habito.registros.length)}
            />
          </section>

          <section className="rounded-2xl border border-outline-variant/60 p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Historial
              </h3>
              <Button
                size="sm"
                variant={habito.completadoHoy ? "default" : "outline"}
                className="h-8 rounded-full px-3 text-[10px] font-bold"
                disabled={registrar.isPending}
                onClick={() =>
                  registrar.mutate({
                    fecha: hoy,
                    completado: !habito.completadoHoy,
                  })
                }
              >
                <Check className="size-3.5" aria-hidden="true" />
                {habito.completadoHoy ? "Completado hoy" : "Marcar hoy"}
              </Button>
            </div>

            <HeatmapHabito
              registros={habito.registrosUltimoAnio}
              color={habito.color}
              tipo={habito.tipo}
              hoy={hoy}
              onToggle={(fecha, completado) =>
                registrar.mutate({ fecha, completado })
              }
            />
          </section>

          <DialogFooter showCloseButton={false}>
            <div className="mr-auto flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-error/30 text-error hover:bg-error-container hover:text-error"
                onClick={() => setEliminarOpen(true)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Eliminar
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={activo.isPending}
                onClick={() => activo.mutate()}
              >
                <Archive className="size-4" aria-hidden="true" />
                {habito.activo ? "Archivar" : "Reactivar"}
              </Button>
            </div>
            <Button type="button" variant="ghost" onClick={onEditar}>
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </Button>
            <Button type="button" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={eliminarOpen} onOpenChange={setEliminarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este hábito?</AlertDialogTitle>
            <AlertDialogDescription>
              Se va a borrar “{habito.titulo}” y todo su historial de registros.
              No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-error text-paper hover:bg-error/90"
              onClick={() => eliminar.mutate()}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function Metrica({
  icon: Icon,
  etiqueta,
  valor,
}: {
  icon: typeof Flame
  etiqueta: string
  valor: string
}) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-3">
      <Icon className="size-3.5 text-secondary" aria-hidden="true" />
      <p className="tabular mt-2 text-lg font-black leading-none text-heading">
        {valor}
      </p>
      <p className="mt-1 text-[8px] font-semibold text-muted-foreground">
        {etiqueta}
      </p>
    </div>
  )
}
