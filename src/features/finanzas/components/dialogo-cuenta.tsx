"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Landmark } from "lucide-react"
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
import { crearCuenta } from "@/features/finanzas/server/functions"
import { tiposCuenta } from "@/features/finanzas/schemas"
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
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState("")
  const [tipo, setTipo] = useState<(typeof tiposCuenta)[number]>("billetera")
  const [color, setColor] = useState(COLORES[0])
  const [rendimiento, setRendimiento] = useState("0")

  useEffect(() => {
    if (!open) return
    setNombre("")
    setTipo("billetera")
    setColor(COLORES[0])
    setRendimiento("0")
  }, [open])

  const mutation = useMutation({
    mutationFn: () =>
      crearCuenta({
        data: {
          nombre,
          tipo,
          color,
          rendimientoAnual: Number(rendimiento) || 0,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["finanzas"] })
      toast.success("Cuenta creada")
      onOpenChange(false)
    },
    onError: () => toast.error("No se pudo crear la cuenta"),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            Nueva cuenta
          </DialogTitle>
          <DialogDescription>
            Agregá una cuenta o billetera para registrar movimientos.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!nombre.trim()) return
            mutation.mutate()
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
              <Label htmlFor="cuenta-tna">Rendimiento anual (%)</Label>
              <Input
                id="cuenta-tna"
                type="number"
                min="0"
                step="0.01"
                value={rendimiento}
                onChange={(event) => setRendimiento(event.target.value)}
              />
            </div>
          </div>

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

          <DialogFooter showCloseButton={false}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!nombre.trim() || mutation.isPending}>
              {mutation.isPending ? (
                "Creando..."
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
