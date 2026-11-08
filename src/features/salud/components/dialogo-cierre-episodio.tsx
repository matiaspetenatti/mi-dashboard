"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Clock } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cerrarEpisodio } from "@/features/salud/server/functions"
import {
  fechaHoraAhora,
  formatearFechaHoraCorta,
  minutosEntre,
  partirEnFechaHora,
  unirFechaHora,
} from "@/features/salud/lib/fechas"
import type { EpisodioConFactores } from "@/features/salud/types"

export function DialogoCierreEpisodio({
  open,
  onOpenChange,
  episodio,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  episodio: EpisodioConFactores | null
}) {
  const queryClient = useQueryClient()
  const [fecha, setFecha] = useState("")
  const [hora, setHora] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const ahora = partirEnFechaHora(fechaHoraAhora())
    setFecha(ahora.fecha)
    setHora(ahora.hora)
    setError(null)
  }, [open, episodio?.id])

  const cerrar = useMutation({
    mutationFn: (finEn: string) => {
      if (!episodio) throw new Error("Episodio inválido")
      return cerrarEpisodio({ data: { id: episodio.id, finEn } })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["salud"] })
      toast.success("Episodio cerrado")
      onOpenChange(false)
    },
    onError: (err) =>
      setError(
        err instanceof Error ? err.message : "No se pudo cerrar el episodio",
      ),
  })

  const finEn = unirFechaHora(fecha, hora)

  function confirmar() {
    if (!episodio || !finEn) {
      setError("Completá fecha y hora de cierre")
      return
    }
    const minutos = minutosEntre(episodio.inicioEn, finEn)
    if (minutos === null || minutos <= 0) {
      setError("El cierre tiene que ser posterior al inicio")
      return
    }
    setError(null)
    cerrar.mutate(finEn)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            Cerrar episodio
          </DialogTitle>
          <DialogDescription>
            {episodio
              ? `Inició el ${formatearFechaHoraCorta(episodio.inicioEn)}.`
              : "Indicá cuándo terminó la crisis."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            confirmar()
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cierre-fecha">Fecha</Label>
              <Input
                id="cierre-fecha"
                type="date"
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cierre-hora">Hora</Label>
              <Input
                id="cierre-hora"
                type="time"
                value={hora}
                onChange={(event) => setHora(event.target.value)}
              />
            </div>
          </div>

          {episodio ? (
            <div className="flex items-center gap-2 rounded-2xl bg-surface-container-low px-3 py-2 text-[10px] font-semibold text-muted-foreground">
              <Clock className="size-3.5 text-secondary" aria-hidden="true" />
              Inicio: {formatearFechaHoraCorta(episodio.inicioEn)}
            </div>
          ) : null}

          {error ? (
            <p className="rounded-xl bg-error-container px-3 py-2 text-[10px] font-semibold text-error">
              {error}
            </p>
          ) : null}

          <DialogFooter showCloseButton={false}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={cerrar.isPending}>
              <CheckCircle2 className="size-4" aria-hidden="true" />
              {cerrar.isPending ? "Cerrando..." : "Cerrar episodio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
