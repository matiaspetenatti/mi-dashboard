"use client"

import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  Minus,
  Package,
  Pencil,
  Plus,
  Search,
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
import { Input } from "@/components/ui/input"
import {
  UBICACIONES,
  abreviaturaUnidad,
  emojiCategoria,
  etiquetaCategoria,
  etiquetaUbicacion,
} from "@/features/comida/constantes"
import { vencimientoDe } from "@/features/comida/lib/inventario"
import {
  ajustarCantidadComida,
  eliminarItemComida,
} from "@/features/comida/server/functions"
import type { ItemComida, UbicacionComida } from "@/server/db/schema"
import { cn } from "cn"

const ORDEN_UBICACIONES: UbicacionComida[] = [
  "heladera",
  "freezer",
  "despensa",
  "bar",
]

function pasoCantidad(item: ItemComida) {
  if (item.unidad === "g" || item.unidad === "ml") return 50
  if (item.unidad === "kg" || item.unidad === "l") return 0.5
  return 1
}

export function VistaDespensa({
  items,
  hoy,
  onNuevo,
  onEditar,
}: {
  items: ItemComida[]
  hoy: string
  onNuevo: () => void
  onEditar: (item: ItemComida) => void
}) {
  const queryClient = useQueryClient()
  const [busqueda, setBusqueda] = useState("")
  const [ubicacion, setUbicacion] = useState<"todas" | UbicacionComida>("todas")
  const [eliminando, setEliminando] = useState<ItemComida | null>(null)

  const ajustar = useMutation({
    mutationFn: ({ id, cantidad }: { id: number; cantidad: number }) =>
      ajustarCantidadComida({ data: { id, cantidad } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["comida"] })
    },
    onError: () => toast.error("No se pudo ajustar la cantidad"),
  })

  const eliminar = useMutation({
    mutationFn: (id: number) => eliminarItemComida({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["comida"] })
      toast.success("Ítem eliminado")
      setEliminando(null)
    },
    onError: () => toast.error("No se pudo eliminar el ítem"),
  })

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return items.filter((item) => {
      if (ubicacion !== "todas" && item.ubicacion !== ubicacion) return false
      if (!texto) return true
      return (
        item.nombre.toLowerCase().includes(texto) ||
        item.categoria.toLowerCase().includes(texto) ||
        (item.notas ?? "").toLowerCase().includes(texto)
      )
    })
  }, [items, busqueda, ubicacion])

  const grupos = ORDEN_UBICACIONES.map((lugar) => ({
    lugar,
    items: filtrados.filter((item) => item.ubicacion === lugar),
  })).filter((grupo) => grupo.items.length > 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-outline-variant/60 bg-card p-3 shadow-elevation-1">
        <div className="relative min-w-48 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar en la despensa..."
            className="h-9 pl-8 text-xs"
            aria-label="Buscar ítem"
          />
        </div>

        <select
          value={ubicacion}
          onChange={(event) =>
            setUbicacion(event.target.value as "todas" | UbicacionComida)
          }
          className="h-9 rounded-xl border border-outline-variant/70 bg-card px-2 text-[10px] font-semibold text-heading outline-none focus:border-ring"
          aria-label="Filtrar por ubicación"
        >
          <option value="todas">Todas las ubicaciones</option>
          {UBICACIONES.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.label}
            </option>
          ))}
        </select>

        <Button
          size="sm"
          className="h-9 rounded-full px-4 text-[10px] font-bold"
          onClick={onNuevo}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Agregar ítem
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-outline-variant/70 bg-card/50 px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-linen-mist text-forest-ink dark:bg-primary-container dark:text-lime-voltage">
            <Package className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-black text-heading">
              Tu despensa está vacía
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cargá ingredientes y utensilios para empezar.
            </p>
          </div>
          <Button onClick={onNuevo}>
            <Plus className="size-4" aria-hidden="true" />
            Agregar el primero
          </Button>
        </div>
      ) : grupos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-outline-variant/70 bg-card/40 px-5 py-12 text-center">
          <p className="text-xs font-bold text-heading">
            No hay ítems con ese filtro
          </p>
        </div>
      ) : (
        grupos.map((grupo) => (
          <section key={grupo.lugar} className="flex flex-col gap-2">
            <header className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black text-heading">
                {etiquetaUbicacion(grupo.lugar)}
              </h2>
              <span className="text-[10px] font-semibold text-muted-foreground">
                {grupo.items.length}{" "}
                {grupo.items.length === 1 ? "ítem" : "ítems"}
              </span>
            </header>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {grupo.items.map((item) => {
                const vence = vencimientoDe(item.caducaEn, hoy)
                const bajoStock =
                  item.tipo === "ingrediente" &&
                  item.stockMinimo !== null &&
                  item.cantidad <= item.stockMinimo
                const paso = pasoCantidad(item)

                return (
                  <article
                    key={item.id}
                    className="flex flex-col rounded-2xl border border-outline-variant/60 bg-card p-3 shadow-elevation-1"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex min-w-0 items-start gap-2">
                        <span className="text-base" aria-hidden="true">
                          {emojiCategoria(item.categoria)}
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate text-[11px] font-black text-heading">
                            {item.nombre}
                          </h3>
                          <p className="truncate text-[8px] text-muted-foreground">
                            {etiquetaCategoria(item.categoria)}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-muted-foreground hover:text-heading"
                          aria-label={`Editar ${item.nombre}`}
                          onClick={() => onEditar(item)}
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-muted-foreground hover:text-error"
                          aria-label={`Eliminar ${item.nombre}`}
                          onClick={() => setEliminando(item)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2 flex items-end gap-1">
                      {item.tipo === "utensilio" ? (
                        <p className="text-[10px] font-semibold text-muted-foreground">
                          Herramienta de bar
                        </p>
                      ) : (
                        <>
                          <span className="tabular text-xl font-black leading-none text-heading">
                            {item.cantidad.toLocaleString("es-AR", {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span className="pb-0.5 text-[9px] font-bold text-muted-foreground">
                            {abreviaturaUnidad(item.unidad)}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.caducaEn ? (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[8px] font-bold",
                            vence.estado === "vencido"
                              ? "bg-error-container text-error"
                              : vence.estado === "hoy" ||
                                  vence.estado === "pronto"
                                ? "bg-warning-container text-warning"
                                : "bg-surface-container text-muted-foreground",
                          )}
                        >
                          {vence.texto}
                        </span>
                      ) : null}
                      {bajoStock ? (
                        <span className="flex items-center gap-0.5 rounded-full bg-warning-container px-1.5 py-0.5 text-[8px] font-bold text-warning">
                          <AlertTriangle className="size-2" aria-hidden="true" />
                          Stock bajo
                        </span>
                      ) : null}
                    </div>

                    {item.tipo === "ingrediente" ? (
                      <div className="mt-2 flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-6"
                          aria-label={`Restar a ${item.nombre}`}
                          disabled={
                            ajustar.isPending ||
                            item.cantidad <= 0
                          }
                          onClick={() =>
                            ajustar.mutate({
                              id: item.id,
                              cantidad: Math.max(0, item.cantidad - paso),
                            })
                          }
                        >
                          <Minus className="size-2.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-6"
                          aria-label={`Sumar a ${item.nombre}`}
                          disabled={ajustar.isPending}
                          onClick={() =>
                            ajustar.mutate({
                              id: item.id,
                              cantidad: item.cantidad + paso,
                            })
                          }
                        >
                          <Plus className="size-2.5" />
                        </Button>
                        {item.notas ? (
                          <span className="ml-auto truncate text-[8px] text-muted-foreground">
                            {item.notas}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          </section>
        ))
      )}

      <AlertDialog
        open={Boolean(eliminando)}
        onOpenChange={(open) => {
          if (!open) setEliminando(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este ítem?</AlertDialogTitle>
            <AlertDialogDescription>
              Se va a borrar “{eliminando?.nombre}” de tu inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-error text-paper hover:bg-error/90"
              onClick={() => {
                if (eliminando) eliminar.mutate(eliminando.id)
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
