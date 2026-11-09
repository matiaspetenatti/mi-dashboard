"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { movimientosFinanzasQuery } from "@/features/finanzas/api"
import {
  MOVIMIENTOS_FINANZAS_INICIALES,
  type MovimientosFinanzasInput,
} from "@/features/finanzas/schemas"
import type {
  CuentaConSaldo,
  MovimientoConCuenta,
} from "@/features/finanzas/types"
import { formatMonto } from "@/lib/format"
import { cn } from "cn"

const CATEGORIA_RENDIMIENTOS = "Rendimientos"

export function MovimientosRecientes({
  cuentas,
  onAgregar,
  onEliminar,
}: {
  cuentas: CuentaConSaldo[]
  onAgregar: () => void
  onEliminar: (movimiento: MovimientoConCuenta) => void
}) {
  const [filtros, setFiltros] = useState<MovimientosFinanzasInput>(
    MOVIMIENTOS_FINANZAS_INICIALES,
  )
  const [busqueda, setBusqueda] = useState("")

  useEffect(() => {
    const id = window.setTimeout(() => {
      setFiltros((actuales) =>
        actuales.busqueda === busqueda.trim()
          ? actuales
          : { ...actuales, busqueda: busqueda.trim(), pagina: 1 },
      )
    }, 300)
    return () => window.clearTimeout(id)
  }, [busqueda])

  const { data, isPending, isError, isFetching, isPlaceholderData, refetch } =
    useQuery(movimientosFinanzasQuery(filtros))

  const desde =
    data && data.total > 0 ? (data.pagina - 1) * data.porPagina + 1 : 0
  const hasta = data ? Math.min(data.pagina * data.porPagina, data.total) : 0
  const hayFiltros =
    Boolean(busqueda.trim()) ||
    Boolean(filtros.busqueda) ||
    filtros.tipo !== "todos" ||
    filtros.cuentaId !== null ||
    Boolean(filtros.categoria) ||
    !filtros.ocultarRendimientos

  function actualizarFiltros(parcial: Partial<MovimientosFinanzasInput>) {
    setFiltros((actuales) => ({ ...actuales, ...parcial, pagina: 1 }))
  }

  function seleccionarCategoria(categoria: string) {
    const esRendimiento = categoria === CATEGORIA_RENDIMIENTOS
    setFiltros((actuales) => ({
      ...actuales,
      categoria,
      pagina: 1,
      ocultarRendimientos: esRendimiento
        ? false
        : actuales.ocultarRendimientos,
    }))
  }

  function alternarOcultarRendimientos(ocultar: boolean) {
    setFiltros((actuales) => ({
      ...actuales,
      ocultarRendimientos: ocultar,
      categoria:
        ocultar && actuales.categoria === CATEGORIA_RENDIMIENTOS
          ? ""
          : actuales.categoria,
      pagina: 1,
    }))
  }

  function limpiarFiltros() {
    setBusqueda("")
    setFiltros({ ...MOVIMIENTOS_FINANZAS_INICIALES })
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-heading">
            Movimientos recientes
          </h2>
          <p className="text-[10px] text-muted-foreground">
            Hasta 20 movimientos por página
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-full px-3 text-[10px] font-bold"
          onClick={onAgregar}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Agregar
        </Button>
      </div>

      <div className="rounded-3xl border border-outline-variant/60 bg-card p-4 shadow-elevation-1">
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          <div className="space-y-1 sm:col-span-3 xl:col-span-1">
            <Label
              htmlFor="mov-filtro-busqueda"
              className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground"
            >
              Buscar
            </Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="mov-filtro-busqueda"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Descripción o categoría"
                className="h-9 pl-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="mov-filtro-tipo"
              className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground"
            >
              Tipo
            </Label>
            <select
              id="mov-filtro-tipo"
              value={filtros.tipo}
              onChange={(event) =>
                actualizarFiltros({
                  tipo: event.target.value as MovimientosFinanzasInput["tipo"],
                })
              }
              className="h-9 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-xs font-semibold text-heading outline-none focus:border-ring"
            >
              <option value="todos">Todos</option>
              <option value="ingreso">Ingresos</option>
              <option value="gasto">Gastos</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="mov-filtro-cuenta"
              className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground"
            >
              Cuenta
            </Label>
            <select
              id="mov-filtro-cuenta"
              value={filtros.cuentaId ?? ""}
              onChange={(event) =>
                actualizarFiltros({
                  cuentaId: event.target.value
                    ? Number(event.target.value)
                    : null,
                })
              }
              className="h-9 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-xs font-semibold text-heading outline-none focus:border-ring"
            >
              <option value="">Todas las cuentas</option>
              {cuentas.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="mov-filtro-categoria"
              className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground"
            >
              Categoría
            </Label>
            <select
              id="mov-filtro-categoria"
              value={filtros.categoria}
              onChange={(event) => seleccionarCategoria(event.target.value)}
              className="h-9 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-xs font-semibold text-heading outline-none focus:border-ring"
            >
              <option value="">Todas las categorías</option>
              {(data?.categorias ?? []).map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="ocultar-rendimientos"
              checked={filtros.ocultarRendimientos}
              onCheckedChange={(checked: boolean) =>
                alternarOcultarRendimientos(checked)
              }
            />
            <Label
              htmlFor="ocultar-rendimientos"
              className="text-[10px] font-semibold text-muted-foreground"
            >
              Ocultar rendimientos
            </Label>
          </div>

          <div className="flex items-center gap-2">
            {isFetching ? (
              <Loader2
                className="size-3.5 animate-spin text-muted-foreground"
                aria-label="Actualizando movimientos"
              />
            ) : null}
            {hayFiltros ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3 text-[10px] font-bold"
                onClick={limpiarFiltros}
              >
                <X className="size-3.5" aria-hidden="true" />
                Limpiar filtros
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-outline-variant/60 bg-card shadow-elevation-1">
        {isPending ? (
          <div className="divide-y divide-outline-variant/30">
            {Array.from({ length: 5 }, (_, indice) => (
              <div key={indice} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-2.5 w-56" />
                </div>
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <p className="text-xs font-bold text-heading">
              No se pudieron cargar los movimientos
            </p>
            <p className="text-[10px] text-muted-foreground">
              Probá de nuevo en unos segundos.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-1 h-8 rounded-full px-3 text-[10px] font-bold"
              onClick={() => void refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : data.movimientos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <p className="text-xs font-bold text-heading">
              Sin movimientos para mostrar
            </p>
            <p className="text-[10px] text-muted-foreground">
              {hayFiltros
                ? "Probá con otros filtros o limpiá la búsqueda."
                : "Registrá el primero y empezá a ver tu historial."}
            </p>
            {hayFiltros ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-1 h-8 rounded-full px-3 text-[10px] font-bold"
                onClick={limpiarFiltros}
              >
                Limpiar filtros
              </Button>
            ) : null}
          </div>
        ) : (
          <ul
            className={cn(
              "divide-y divide-outline-variant/30 transition-opacity",
              isPlaceholderData && "opacity-60",
            )}
          >
            {data.movimientos.map((movimiento) => (
              <FilaMovimiento
                key={movimiento.id}
                movimiento={movimiento}
                onEliminar={() => onEliminar(movimiento)}
              />
            ))}
          </ul>
        )}
      </div>

      {data && data.total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="tabular text-[10px] font-semibold text-muted-foreground">
            Mostrando {desde}–{hasta} de {data.total} movimientos
          </p>

          {data.totalPaginas > 1 ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full px-3 text-[10px] font-bold"
                disabled={data.pagina <= 1}
                onClick={() =>
                  setFiltros((actuales) => ({
                    ...actuales,
                    pagina: data.pagina - 1,
                  }))
                }
              >
                Anterior
              </Button>
              <span className="tabular text-[10px] font-bold text-muted-foreground">
                {data.pagina} / {data.totalPaginas}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full px-3 text-[10px] font-bold"
                disabled={data.pagina >= data.totalPaginas}
                onClick={() =>
                  setFiltros((actuales) => ({
                    ...actuales,
                    pagina: data.pagina + 1,
                  }))
                }
              >
                Siguiente
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function FilaMovimiento({
  movimiento,
  onEliminar,
}: {
  movimiento: MovimientoConCuenta
  onEliminar: () => void
}) {
  const ingreso = movimiento.tipo === "ingreso"

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          ingreso
            ? "bg-success-container text-success"
            : "bg-error-container text-error",
        )}
      >
        {ingreso ? (
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        ) : (
          <ArrowDownLeft className="size-3.5" aria-hidden="true" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-heading">
          {movimiento.descripcion || movimiento.categoria}
        </p>
        <p className="truncate text-[9px] text-muted-foreground">
          {format(parseISO(movimiento.fecha), "d MMM yyyy", {
            locale: es,
          })}{" "}
          · {movimiento.categoria}
          {movimiento.cuenta ? ` · ${movimiento.cuenta.nombre}` : ""}
        </p>
      </div>

      <span
        className={cn(
          "tabular shrink-0 text-xs font-black",
          ingreso ? "text-success" : "text-error",
        )}
      >
        {ingreso ? "+" : "-"}
        {formatMonto(movimiento.monto)}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground hover:text-error"
        aria-label="Eliminar movimiento"
        onClick={onEliminar}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  )
}
