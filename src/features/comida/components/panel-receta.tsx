"use client"

import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ChefHat,
  Clock,
  Flame,
  Loader2,
  Pencil,
  ShoppingBasket,
  Star,
  Trash2,
  Users,
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
import { etiquetaTipoReceta, etiquetaTono } from "@/features/comida/constantes"
import { formatearCantidad } from "@/features/comida/lib/cantidades"
import {
  alcanzaStock,
  buscarEnStock,
  proponerDescuento,
} from "@/features/comida/lib/inventario"
import {
  agregarFaltantesReceta,
  alternarFavoritaReceta,
  cocinarReceta,
  eliminarReceta,
} from "@/features/comida/server/functions"
import type { ItemComida, RecetaComida } from "@/server/db/schema"
import { cn } from "cn"

export function PanelReceta({
  receta,
  items,
  open,
  onOpenChange,
  onEditar,
  onEliminada,
}: {
  receta: RecetaComida
  items: ItemComida[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditar: () => void
  onEliminada?: () => void
}) {
  const queryClient = useQueryClient()
  const [cocinarOpen, setCocinarOpen] = useState(false)
  const [descontarStock, setDescontarStock] = useState(true)
  const [eliminarOpen, setEliminarOpen] = useState(false)

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["comida"] })
  }

  const favorita = useMutation({
    mutationFn: () =>
      alternarFavoritaReceta({
        data: { id: receta.id, favorita: !receta.favorita },
      }),
    onSuccess: invalidar,
    onError: () => toast.error("No se pudo actualizar favoritos"),
  })

  const faltantes = useMutation({
    mutationFn: () =>
      agregarFaltantesReceta({ data: { recetaId: receta.id } }),
    onSuccess: (resultado) => {
      invalidar()
      toast.success(
        resultado.agregados > 0
          ? `${resultado.agregados} ítem(s) agregados a la lista`
          : "No faltaba nada para comprar",
      )
    },
    onError: () => toast.error("No se pudieron agregar los faltantes"),
  })

  const cocinar = useMutation({
    mutationFn: () =>
      cocinarReceta({
        data: { id: receta.id, descontarStock },
      }),
    onSuccess: (resultado) => {
      invalidar()
      toast.success(
        resultado.descontados > 0
          ? `Receta cocinada. Se descontaron ${resultado.descontados} ingredientes.`
          : "Receta cocinada",
      )
      setCocinarOpen(false)
    },
    onError: () => toast.error("No se pudo registrar la receta cocinada"),
  })

  const eliminar = useMutation({
    mutationFn: () => eliminarReceta({ data: { id: receta.id } }),
    onSuccess: () => {
      invalidar()
      toast.success("Receta eliminada")
      setEliminarOpen(false)
      onOpenChange(false)
      onEliminada?.()
    },
    onError: () => toast.error("No se pudo eliminar la receta"),
  })

  const descuentos = useMemo(
    () => proponerDescuento(receta.ingredientes, items),
    [receta.ingredientes, items],
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <DialogTitle className="text-lg font-black tracking-tight">
                  {receta.titulo}
                </DialogTitle>
                <DialogDescription>
                  {etiquetaTipoReceta(receta.tipo)} ·{" "}
                  {etiquetaTono(receta.tono)}
                </DialogDescription>
              </div>
              <Button
                type="button"
                variant={receta.favorita ? "default" : "outline"}
                size="icon"
                className="size-8 shrink-0 rounded-full"
                aria-label={
                  receta.favorita ? "Quitar de favoritas" : "Marcar favorita"
                }
                disabled={favorita.isPending}
                onClick={() => favorita.mutate()}
              >
                <Star
                  className={cn("size-3.5", receta.favorita && "fill-current")}
                />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1">
              <Clock className="size-3" aria-hidden="true" />
              {receta.minutos} min
            </span>
            <span className="flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1">
              <Users className="size-3" aria-hidden="true" />
              {receta.porciones === 1
                ? "1 porción"
                : `${receta.porciones} porciones`}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-1">
              <ChefHat className="size-3" aria-hidden="true" />
              {receta.origen === "ia" ? "Generada por IA" : "Cargada a mano"}
            </span>
            {receta.vecesCocinada > 0 ? (
              <span className="rounded-full bg-success-container px-2.5 py-1 text-success">
                Cocinada {receta.vecesCocinada} vez/veces
              </span>
            ) : null}
          </div>

          {receta.nutricion ? (
            <section className="grid grid-cols-4 gap-1.5 rounded-2xl bg-surface-container-low p-3">
              {[
                ["kcal", "kcal"],
                ["proteinas", "prot."],
                ["carbos", "carbos"],
                ["grasas", "grasas"],
              ].map(([clave, etiqueta]) => (
                <div key={clave} className="text-center">
                  <p className="tabular text-sm font-black text-heading">
                    {Math.round(
                      Number(
                        receta.nutricion?.[
                          clave as keyof typeof receta.nutricion
                        ] ?? 0,
                      ),
                    )}
                  </p>
                  <p className="text-[8px] font-bold uppercase text-muted-foreground">
                    {etiqueta}
                  </p>
                </div>
              ))}
            </section>
          ) : null}

          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Ingredientes
            </h3>
            <ul className="mt-2 divide-y divide-outline-variant/30 rounded-2xl border border-outline-variant/40">
              {receta.ingredientes.map((ingrediente, indice) => {
                const stock = buscarEnStock(ingrediente.nombre, items)
                const alcanza =
                  stock &&
                  alcanzaStock(stock, ingrediente.cantidad, ingrediente.unidad)
                return (
                  <li
                    key={`${ingrediente.nombre}-${indice}`}
                    className="flex items-center gap-2 px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 text-[11px] font-semibold text-heading">
                      {ingrediente.nombre}
                      {ingrediente.opcional ? (
                        <span className="ml-1 text-[8px] text-muted-foreground">
                          (opcional)
                        </span>
                      ) : null}
                    </span>
                    <span className="tabular text-[10px] text-muted-foreground">
                      {formatearCantidad(
                        ingrediente.cantidad,
                        ingrediente.unidad,
                      )}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[8px] font-bold",
                        alcanza
                          ? "bg-success-container text-success"
                          : "bg-warning-container text-warning",
                      )}
                    >
                      {alcanza ? "Tenés" : stock ? "Falta" : "Comprar"}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>

          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Pasos
            </h3>
            <ol className="mt-2 space-y-2">
              {receta.pasos.map((paso, indice) => (
                <li key={indice} className="flex gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-forest-ink text-[9px] font-black text-paper dark:bg-lime-voltage dark:text-forest-ink">
                    {indice + 1}
                  </span>
                  <p className="pt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    {paso}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {receta.tips ? (
            <p className="rounded-2xl bg-linen-mist/60 px-3 py-2 text-[10px] text-forest-ink dark:bg-primary-container/40 dark:text-lime-voltage">
              <span className="font-bold">Tip:</span> {receta.tips}
            </p>
          ) : null}

          {receta.tipo === "trago" &&
          (receta.herramientas.length > 0 ||
            receta.vaso ||
            receta.tecnica) ? (
            <section className="rounded-2xl bg-surface-container-low p-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Barra
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {[
                  receta.herramientas.length > 0
                    ? receta.herramientas.join(", ")
                    : null,
                  receta.vaso ? `Vaso: ${receta.vaso}` : null,
                  receta.tecnica ? `Técnica: ${receta.tecnica}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </section>
          ) : null}

          <DialogFooter showCloseButton={false}>
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
              onClick={() => faltantes.mutate()}
              disabled={faltantes.isPending}
            >
              <ShoppingBasket className="size-4" aria-hidden="true" />
              Agregar faltantes
            </Button>
            <Button type="button" onClick={() => setCocinarOpen(true)}>
              <Flame className="size-4" aria-hidden="true" />
              Cocinar
            </Button>
            <Button type="button" variant="ghost" onClick={onEditar}>
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cocinarOpen} onOpenChange={setCocinarOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight">
              Cocinar “{receta.titulo}”
            </DialogTitle>
            <DialogDescription>
              Se registra la receta como cocinada. Podés descontar los
              ingredientes que tenés en stock.
            </DialogDescription>
          </DialogHeader>

          <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-outline-variant/60 bg-surface-container-low px-3 py-2">
            <input
              type="checkbox"
              checked={descontarStock}
              onChange={(event) => setDescontarStock(event.target.checked)}
              className="size-4 accent-lime-voltage"
            />
            <span className="text-[11px] font-semibold text-heading">
              Descontar ingredientes del stock
            </span>
          </label>

          {descontarStock ? (
            descuentos.length > 0 ? (
              <ul className="divide-y divide-outline-variant/30 rounded-2xl border border-outline-variant/40">
                {descuentos.map((descuento) => (
                  <li
                    key={descuento.ingredienteId}
                    className="flex items-center justify-between gap-2 px-3 py-2"
                  >
                    <span className="text-[10px] font-semibold text-heading">
                      {descuento.nombre}
                    </span>
                    <span className="tabular text-[9px] text-muted-foreground">
                      {descuento.texto} → queda {descuento.restante}{" "}
                      {descuento.unidad}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-surface-container-low px-3 py-2 text-[10px] text-muted-foreground">
                No hay ingredientes del inventario para descontar.
              </p>
            )
          ) : null}

          <DialogFooter showCloseButton={false}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCocinarOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={cocinar.isPending}
              onClick={() => cocinar.mutate()}
            >
              {cocinar.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Flame className="size-4" aria-hidden="true" />
              )}
              {cocinar.isPending ? "Guardando..." : "Cocinar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={eliminarOpen} onOpenChange={setEliminarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta receta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se va a borrar “{receta.titulo}” del recetario. Los platos del menú
              que la usan quedarán con su título, pero sin receta asociada.
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
