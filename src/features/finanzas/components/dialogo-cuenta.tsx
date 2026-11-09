"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Landmark, Save } from "lucide-react"
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
import { calcularRendimientoDiarioCentavos } from "@/features/finanzas/lib/cuentas"
import {
  actualizarCuenta,
  crearCuenta,
} from "@/features/finanzas/server/functions"
import { tiposCuenta } from "@/features/finanzas/schemas"
import type { CuentaConSaldo } from "@/features/finanzas/types"
import { formatMonto, formatNota } from "@/lib/format"
import { cn } from "cn"

const COLORES = [
  "#163300",
  "#054d28",
  "#0b4c72",
  "#cb272f",
  "#6750a4",
  "#f59e0b",
]

const ETIQUETAS: Record<(typeof tiposCuenta)[number], string> = {
  billetera: "Billetera",
  banco: "Banco",
  efectivo: "Efectivo",
  inversion: "Inversión",
  otro: "Otro",
}

export function DialogoCuenta({
  open,
  onOpenChange,
  cuenta,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cuenta?: CuentaConSaldo | null
}) {
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState("")
  const [tipo, setTipo] = useState<(typeof tiposCuenta)[number]>("billetera")
  const [color, setColor] = useState(COLORES[0])
  const [rendimiento, setRendimiento] = useState("0")
  const [saldoInicial, setSaldoInicial] = useState("")

  useEffect(() => {
    if (!open) return
    setNombre(cuenta?.nombre ?? "")
    setTipo(cuenta?.tipo ?? "billetera")
    setColor(cuenta?.color ?? COLORES[0])
    setRendimiento(String(cuenta?.rendimientoAnual ?? 0))
    setSaldoInicial("")
  }, [open, cuenta?.id])

  const guardar = useMutation({
    mutationFn: async () => {
      const tna = Number(rendimiento) || 0

      if (cuenta) {
        await actualizarCuenta({
          data: {
            id: cuenta.id,
            nombre,
            tipo,
            color,
            rendimientoAnual: tna,
          },
        })
        return { id: cuenta.id }
      }

      return crearCuenta({
        data: {
          nombre,
          tipo,
          color,
          rendimientoAnual: tna,
          saldoInicialCentavos: Math.round(
            (Number(saldoInicial) || 0) * 100,
          ),
        },
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["finanzas"] })
      toast.success(cuenta ? "Cuenta actualizada" : "Cuenta creada")
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la cuenta",
      ),
  })

  const tnaNumero = Number(rendimiento) || 0
  const saldoBaseCentavos = cuenta
    ? cuenta.saldo
    : Math.round((Number(saldoInicial) || 0) * 100)
  const estimadoDiario = calcularRendimientoDiarioCentavos(
    saldoBaseCentavos,
    tnaNumero,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            {cuenta ? "Editar cuenta" : "Nueva cuenta"}
          </DialogTitle>
          <DialogDescription>
            {cuenta
              ? "Actualizá el nombre, tipo, color o rendimiento anual."
              : "Agregá una cuenta o billetera para registrar movimientos."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!nombre.trim()) return
            guardar.mutate()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="cuenta-nombre">Nombre</Label>
            <Input
              id="cuenta-nombre"
              autoFocus
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Cuenta principal, Efectivo, Inversiones..."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cuenta-tipo">Tipo</Label>
              <select
                id="cuenta-tipo"
                value={tipo}
                onChange={(event) =>
                  setTipo(event.target.value as (typeof tiposCuenta)[number])
                }
                className="h-10 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-sm text-heading outline-none focus:border-ring"
              >
                {tiposCuenta.map((item) => (
                  <option key={item} value={item}>
                    {ETIQUETAS[item]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cuenta-tna">Rendimiento anual (% TNA)</Label>
              <Input
                id="cuenta-tna"
                type="number"
                min="0"
                max="1000"
                step="0.01"
                value={rendimiento}
                onChange={(event) => setRendimiento(event.target.value)}
              />
            </div>
          </div>

          {!cuenta ? (
            <div className="space-y-2">
              <Label htmlFor="cuenta-saldo-inicial">
                Saldo inicial (opcional)
              </Label>
              <Input
                id="cuenta-saldo-inicial"
                type="number"
                step="0.01"
                value={saldoInicial}
                onChange={(event) => setSaldoInicial(event.target.value)}
                placeholder="0,00"
              />
              <p className="text-[9px] text-muted-foreground">
                Se registra como movimiento de Ajuste y no cuenta como
                ingreso del mes.
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORES.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-label={`Color ${item}`}
                  onClick={() => setColor(item)}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform hover:scale-110",
                    color === item
                      ? "border-heading ring-2 ring-lime-voltage"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: item }}
                />
              ))}
            </div>
          </div>

          {tnaNumero > 0 && saldoBaseCentavos > 0 ? (
            <div className="rounded-xl border border-success/20 bg-success-container/60 p-3 text-[10px] text-on-success-container">
              <p className="font-bold">
                Con {formatMonto(saldoBaseCentavos)} al{" "}
                {formatNota(tnaNumero)}% TNA:
              </p>
              <p className="mt-1">
                Estimado: +{formatMonto(estimadoDiario)}/día · +
                {formatMonto(estimadoDiario * 30)}/mes
              </p>
            </div>
          ) : null}

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
              disabled={!nombre.trim() || guardar.isPending}
            >
              {guardar.isPending ? (
                "Guardando..."
              ) : cuenta ? (
                <>
                  <Save className="size-4" aria-hidden="true" />
                  Guardar cambios
                </>
              ) : (
                <>
                  <Landmark className="size-4" aria-hidden="true" />
                  Crear cuenta
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
