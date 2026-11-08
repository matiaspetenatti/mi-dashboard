"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { crearMovimiento } from "@/features/finanzas/server/functions"
import type { CategoriaFinanza } from "@/server/db/schema"
import type { CuentaConSaldo } from "@/features/finanzas/types"
import { fechaHoy } from "@/lib/dates"
import { cn } from "cn"

export function DialogoMovimiento({
  open,
  onOpenChange,
  cuentas,
  categorias,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cuentas: CuentaConSaldo[]
  categorias: CategoriaFinanza[]
}) {
  const queryClient = useQueryClient()
  const [tipo, setTipo] = useState<"ingreso" | "gasto">("gasto")
  const [monto, setMonto] = useState("")
  const [cuentaId, setCuentaId] = useState<number | null>(null)
  const [categoria, setCategoria] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [fecha, setFecha] = useState(fechaHoy())

  const categoriasFiltradas = useMemo(
    () => categorias.filter((item) => item.tipo === tipo),
    [categorias, tipo],
  )

  useEffect(() => {
    if (!open) return
    setTipo("gasto")
    setMonto("")
    setCuentaId(cuentas.at(0)?.id ?? null)
    setCategoria("")
    setDescripcion("")
    setFecha(fechaHoy())
  }, [open, cuentas])

  const mutation = useMutation({
    mutationFn: () => {
      if (!cuentaId) throw new Error("Elegí una cuenta")
      const montoCentavos = Math.round(Number(monto) * 100)
      if (!montoCentavos || montoCentavos <= 0)
        throw new Error("Ingresá un monto válido")
      return crearMovimiento({
        data: {
          cuentaId,
          tipo,
          monto: montoCentavos,
          categoria,
          descripcion: descripcion.trim() || null,
          fecha,
        },
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["finanzas"] })
      toast.success("Movimiento registrado")
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "No se pudo registrar",
      )
    },
  })

  const puedeGuardar =
    Boolean(cuentaId) &&
    Number(monto) > 0 &&
    categoria.trim().length > 0 &&
    Boolean(fecha)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            Nuevo movimiento
          </DialogTitle>
          <DialogDescription>
            Registrá un ingreso o gasto en una de tus cuentas.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!puedeGuardar) return
            mutation.mutate()
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipo("gasto")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition-colors",
                tipo === "gasto"
                  ? "border-error bg-error text-paper"
                  : "border-outline-variant/70 bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              <ArrowDownLeft className="size-3.5" aria-hidden="true" />
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setTipo("ingreso")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition-colors",
                tipo === "ingreso"
                  ? "border-success bg-success text-paper"
                  : "border-outline-variant/70 bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
              Ingreso
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mov-monto">Monto</Label>
            <Input
              id="mov-monto"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              placeholder="0,00"
              value={monto}
              onChange={(event) => setMonto(event.target.value)}
              className="text-base font-bold"
              autoFocus
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mov-cuenta">Cuenta</Label>
              <select
                id="mov-cuenta"
                value={cuentaId ?? ""}
                onChange={(event) => setCuentaId(Number(event.target.value))}
                className="h-10 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-sm text-heading outline-none focus:border-ring"
              >
                {cuentas.map((cuenta) => (
                  <option key={cuenta.id} value={cuenta.id}>
                    {cuenta.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mov-fecha">Fecha</Label>
              <Input
                id="mov-fecha"
                type="date"
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mov-categoria">Categoría</Label>
            <Input
              id="mov-categoria"
              list="categorias-finanzas"
              placeholder="Ej. Supermercado, Sueldo..."
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
            />
            <datalist id="categorias-finanzas">
              {categoriasFiltradas.map((item) => (
                <option key={item.id} value={item.nombre} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mov-descripcion">Descripción</Label>
            <Textarea
              id="mov-descripcion"
              rows={2}
              placeholder="Opcional"
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
            />
          </div>

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
              disabled={!puedeGuardar || mutation.isPending}
            >
              <Plus className="size-4" aria-hidden="true" />
              {mutation.isPending ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
