"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Landmark,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  Wallet,
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
import { PageHeader } from "@/components/organisms/page-header"
import { Button } from "@/components/ui/button"
import { CategoriasFinanzasChart } from "@/features/finanzas/components/categorias-finanzas-chart"
import { ComparadorServicios } from "@/features/finanzas/components/comparador-servicios"
import { DialogoAjustarSaldo } from "@/features/finanzas/components/dialogo-ajustar-saldo"
import { DialogoCuenta } from "@/features/finanzas/components/dialogo-cuenta"
import { DialogoMovimiento } from "@/features/finanzas/components/dialogo-movimiento"
import { EvolucionFinanzas } from "@/features/finanzas/components/evolucion-finanzas"
import { MovimientosRecientes } from "@/features/finanzas/components/movimientos-recientes"
import {
  eliminarCuenta,
  eliminarMovimiento,
} from "@/features/finanzas/server/functions"
import type {
  CuentaConSaldo,
  FinanzasWorkspace,
  MovimientoConCuenta,
} from "@/features/finanzas/types"
import { formatMonto, formatNota } from "@/lib/format"

const ETIQUETAS_CUENTA: Record<string, string> = {
  billetera: "Billetera",
  banco: "Banco",
  efectivo: "Efectivo",
  inversion: "Inversión",
  otro: "Otro",
}

export function WorkspaceFinanzas({
  workspace,
}: {
  workspace: FinanzasWorkspace
}) {
  const queryClient = useQueryClient()
  const [movimientoOpen, setMovimientoOpen] = useState(false)
  const [cuentaOpen, setCuentaOpen] = useState(false)
  const [cuentaEditando, setCuentaEditando] =
    useState<CuentaConSaldo | null>(null)
  const [cuentaAjustando, setCuentaAjustando] =
    useState<CuentaConSaldo | null>(null)
  const [cuentaAEliminar, setCuentaAEliminar] =
    useState<CuentaConSaldo | null>(null)
  const [movimientoAEliminar, setMovimientoAEliminar] =
    useState<MovimientoConCuenta | null>(null)

  const borrar = useMutation({
    mutationFn: (id: number) => eliminarMovimiento({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["finanzas"] })
      toast.success("Movimiento eliminado")
      setMovimientoAEliminar(null)
    },
    onError: () => toast.error("No se pudo eliminar el movimiento"),
  })

  const borrarCuenta = useMutation({
    mutationFn: (id: number) => eliminarCuenta({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["finanzas"] })
      toast.success("Cuenta eliminada")
      setCuentaAEliminar(null)
    },
    onError: () => toast.error("No se pudo eliminar la cuenta"),
  })

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Patrimonio"
        title="Finanzas"
        description="Cuentas, movimientos y evolución de tu patrimonio en un solo lugar."
        meta={`${workspace.resumen.cantidadCuentas} cuentas`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="h-10 rounded-full px-4 text-xs font-bold"
              onClick={() => {
                setCuentaEditando(null)
                setCuentaOpen(true)
              }}
            >
              <Landmark className="size-4" aria-hidden="true" />
              Nueva cuenta
            </Button>
            <Button
              className="h-10 rounded-full px-5 text-xs font-bold"
              onClick={() => setMovimientoOpen(true)}
            >
              <Plus className="size-4" aria-hidden="true" />
              Nuevo movimiento
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="col-span-2 rounded-3xl border border-card-inverse-border bg-card-inverse p-5 text-card-inverse-foreground lg:col-span-1">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-card-inverse-muted" aria-hidden="true" />
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-card-inverse-muted/80">
              Saldo total
            </p>
          </div>
          <p className="tabular mt-3 text-3xl font-black leading-none">
            {formatMonto(workspace.resumen.saldoTotal)}
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-card-inverse-muted">
            <TrendingUp className="size-3" aria-hidden="true" />
            +{formatMonto(workspace.resumen.rendimientoDiario)}/día
          </p>
        </div>

        <div className="rounded-3xl border border-outline-variant/60 bg-card p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Ingresos del mes
          </p>
          <p className="tabular mt-3 text-2xl font-black leading-none text-heading">
            {formatMonto(workspace.resumen.ingresosMes)}
          </p>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Este mes
          </p>
        </div>

        <div className="rounded-3xl border border-outline-variant/60 bg-card p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Gastos del mes
          </p>
          <p className="tabular mt-3 text-2xl font-black leading-none text-heading">
            {formatMonto(workspace.resumen.gastosMes)}
          </p>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Este mes
          </p>
        </div>

        <div className="rounded-3xl border border-outline-variant/60 bg-card p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Rendimiento
          </p>
          <p className="tabular mt-3 text-2xl font-black leading-none text-heading">
            {formatMonto(workspace.resumen.rendimientoMensual)}
          </p>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Estimado mensual
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-black text-heading">Cuentas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {workspace.cuentas.map((cuenta) => (
            <article
              key={cuenta.id}
              className="rounded-3xl border border-outline-variant/60 bg-card p-4 shadow-elevation-1"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: cuenta.color }}
                  />
                  <h3 className="truncate text-xs font-black text-heading">
                    {cuenta.nombre}
                  </h3>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-heading"
                    aria-label={`Editar ${cuenta.nombre}`}
                    onClick={() => setCuentaEditando(cuenta)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-error"
                    aria-label={`Eliminar ${cuenta.nombre}`}
                    onClick={() => setCuentaAEliminar(cuenta)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {ETIQUETAS_CUENTA[cuenta.tipo] ?? cuenta.tipo}
              </p>
              <p className="tabular mt-3 text-xl font-black leading-none text-heading">
                {formatMonto(cuenta.saldo)}
              </p>
              <p className="mt-2 text-[9px] font-semibold text-muted-foreground">
                {cuenta.rendimientoAnual > 0
                  ? `+${formatMonto(cuenta.estimadoDiario)}/día · ${formatNota(cuenta.rendimientoAnual)}% TNA`
                  : "Sin rendimiento"}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 h-7 w-full rounded-full px-3 text-[9px] font-bold"
                onClick={() => setCuentaAjustando(cuenta)}
              >
                <SlidersHorizontal className="size-3" aria-hidden="true" />
                Ajustar saldo
              </Button>
            </article>
          ))}

          {workspace.cuentas.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-outline-variant/70 p-6 text-center text-xs text-muted-foreground sm:col-span-2 lg:col-span-4">
              Todavía no tenés cuentas. Creá la primera para empezar.
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <EvolucionFinanzas evolucion={workspace.evolucion} />
        <CategoriasFinanzasChart categorias={workspace.categorias} />
      </section>

      <ComparadorServicios comparacion={workspace.servicios} />

      <MovimientosRecientes
        cuentas={workspace.cuentas}
        categorias={workspace.categoriasDisponibles}
        onAgregar={() => setMovimientoOpen(true)}
        onEliminar={setMovimientoAEliminar}
      />

      <DialogoMovimiento
        open={movimientoOpen}
        onOpenChange={setMovimientoOpen}
        cuentas={workspace.cuentas}
        categorias={workspace.categoriasDisponibles}
      />

      <DialogoCuenta
        key={cuentaEditando?.id ?? "nueva"}
        open={cuentaOpen || Boolean(cuentaEditando)}
        cuenta={cuentaEditando}
        onOpenChange={(open) => {
          if (!open) {
            setCuentaOpen(false)
            setCuentaEditando(null)
          }
        }}
      />

      <DialogoAjustarSaldo
        cuenta={cuentaAjustando}
        open={Boolean(cuentaAjustando)}
        onOpenChange={(open) => {
          if (!open) setCuentaAjustando(null)
        }}
      />

      <AlertDialog
        open={Boolean(cuentaAEliminar)}
        onOpenChange={(open) => {
          if (!open) setCuentaAEliminar(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se va a borrar “{cuentaAEliminar?.nombre}” y todos sus
              movimientos asociados. Saldo actual:{" "}
              {cuentaAEliminar ? formatMonto(cuentaAEliminar.saldo) : ""}. No
              se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-error text-paper hover:bg-error/90"
              onClick={() => {
                if (cuentaAEliminar) borrarCuenta.mutate(cuentaAEliminar.id)
              }}
            >
              Eliminar cuenta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(movimientoAEliminar)}
        onOpenChange={(open) => {
          if (!open) setMovimientoAEliminar(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este movimiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Se va a borrar “{movimientoAEliminar?.descripcion || movimientoAEliminar?.categoria}”
              por {movimientoAEliminar ? formatMonto(movimientoAEliminar.monto) : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-error text-paper hover:bg-error/90"
              onClick={() => {
                if (movimientoAEliminar) borrar.mutate(movimientoAEliminar.id)
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
