"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { SlidersHorizontal } from "lucide-react"
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
import { calcularAjusteSaldo } from "@/features/finanzas/lib/cuentas"
import { ajustarSaldoCuenta } from "@/features/finanzas/server/functions"
import type { CuentaConSaldo } from "@/features/finanzas/types"
import { fechaHoy } from "@/lib/dates"
import { formatMonto } from "@/lib/format"
import { cn } from "cn"

export function DialogoAjustarSaldo({
  cuenta,
  open,
  onOpenChange,
}: {
  cuenta: CuentaConSaldo | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [nuevoSaldo, setNuevoSaldo] = useState("")
  const [fecha, setFecha] = useState(fechaHoy())
  const [descripcion, setDescripcion] = useState("")

  useEffect(() => {
    if (!open || !cuenta) return
    setNuevoSaldo(String(cuenta.saldo / 100))
    setFecha(fechaHoy())
    setDescripcion("")
  }, [open, cuenta?.id])

  const nuevoSaldoCentavos =
    nuevoSaldo.trim() !== "" && Number.isFinite(Number(nuevoSaldo))
      ? Math.round(Number(nuevoSaldo) * 100)
      : null

  const ajuste =
    cuenta && nuevoSaldoCentavos !== null
      ? calcularAjusteSaldo({
          saldoActualCentavos: cuenta.saldo,
          nuevoSaldoCentavos,
        })
      : null

  const mutation = useMutation({
    mutationFn: () => {
      if (!cuenta || nuevoSaldoCentavos === null) {
        throw new Error("Ingresá un saldo válido")
      }

      return ajustarSaldoCuenta({
        data: {
          cuentaId: cuenta.id,
          nuevoSaldoCentavos,
          fecha,
          descripcion: descripcion.trim() || null,
        },
      })
    },
    onSuccess: (resultado) => {
      void queryClient.invalidateQueries({ queryKey: ["finanzas"] })
      toast.success(
        resultado.sinCambios ? "El saldo ya coincidía" : "Saldo ajustado",
      )
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo ajustar el saldo",
      ),
  })

  if (!cuenta) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            Ajustar saldo
          </DialogTitle>
          <DialogDescription>
            {cuenta.nombre}. El saldo se recalcula automáticamente a partir de
            los movimientos.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (nuevoSaldoCentavos === null) return
            mutation.mutate()
          }}
        >
          <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Saldo actual
            </p>
            <p className="tabular mt-1 text-lg font-black text-heading">
              {formatMonto(cuenta.saldo)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ajuste-nuevo-saldo">Nuevo saldo ($)</Label>
            <Input
              id="ajuste-nuevo-saldo"
              type="number"
              step="0.01"
              autoFocus
              value={nuevoSaldo}
              onChange={(event) => setNuevoSaldo(event.target.value)}
              placeholder="0,00"
              className="text-base font-bold"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ajuste-fecha">Fecha</Label>
              <Input
                id="ajuste-fecha"
                type="date"
                max={fechaHoy()}
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ajuste-motivo">Motivo (opcional)</Label>
              <Input
                id="ajuste-motivo"
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                placeholder="Ajuste de saldo"
              />
            </div>
          </div>

          {ajuste ? (
            <div
              className={cn(
                "rounded-xl border p-3 text-[10px]",
                ajuste.tipo === null
                  ? "border-outline-variant/60 bg-surface-container-low text-muted-foreground"
                  : ajuste.tipo === "ingreso"
                    ? "border-success/20 bg-success-container/60 text-on-success-container"
                    : "border-error/20 bg-error-container/60 text-on-error-container",
              )}
            >
              {ajuste.tipo === null ? (
                <p>El saldo ya coincide. No se creará ningún movimiento.</p>
              ) : (
                <>
                  <p className="font-bold">
                    Se registrará un{" "}
                    {ajuste.tipo === "ingreso" ? "ingreso" : "gasto"} de
                    Ajuste por {formatMonto(ajuste.monto)}.
                  </p>
                  <p className="mt-1">
                    El saldo quedará en{" "}
                    {formatMonto(nuevoSaldoCentavos ?? cuenta.saldo)}.
                  </p>
                </>
              )}
            </div>
          ) : null}

          <p className="text-[9px] text-muted-foreground">
            Este ajuste no se cuenta como ingreso ni gasto en los KPIs del mes.
          </p>

          <DialogFooter showCloseButton={false}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={nuevoSaldoCentavos === null || mutation.isPending}
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              {mutation.isPending ? "Ajustando..." : "Ajustar saldo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
