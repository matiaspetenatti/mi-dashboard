"use client"

import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  PackageCheck,
  Pencil,
  Plus,
  ShoppingBasket,
  Sparkles,
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
import { DialogoItemLista } from "@/features/comida/components/dialogo-item-lista"
import {
  CATEGORIAS,
  etiquetaCategoria,
  etiquetaOrigenLista,
} from "@/features/comida/constantes"
import {
  agregarSugerenciasStock,
  alternarComprado,
  eliminarItemLista,
  limpiarComprados,
} from "@/features/comida/server/functions"
import { formatMonto } from "@/lib/format"
import type { ItemListaComida } from "@/server/db/schema"

export function VistaCompras({ lista }: { lista: ItemListaComida[] }) {
  const queryClient = useQueryClient()
  const [dialogoOpen, setDialogoOpen] = useState(false)
  const [editando, setEditando] = useState<ItemListaComida | null>(null)
  const [eliminando, setEliminando] = useState<ItemListaComida | null>(null)
  const [limpiarOpen, setLimpiarOpen] = useState(false)

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["comida"] })
  }

  const toggle = useMutation({
    mutationFn: (item: ItemListaComida) =>
      alternarComprado({
        data: { id: item.id, comprado: !item.comprado },
      }),
    onSuccess: (_resultado, item) => {
      invalidar()
      toast.success(
        item.comprado
          ? "Ítem marcado como pendiente"
          : "Compra marcada. Se repuso en la despensa.",
      )
    },
    onError: () => toast.error("No se pudo actualizar la compra"),
  })

  const eliminar = useMutation({
    mutationFn: (id: number) => eliminarItemLista({ data: { id } }),
    onSuccess: () => {
      invalidar()
      toast.success("Ítem eliminado de la lista")
      setEliminando(null)
    },
    onError: () => toast.error("No se pudo eliminar el ítem"),
  })

  const limpiar = useMutation({
    mutationFn: () => limpiarComprados(),
    onSuccess: () => {
      invalidar()
      setLimpiarOpen(false)
      toast.success("Comprados eliminados")
    },
    onError: () => toast.error("No se pudieron limpiar los comprados"),
  })

  const sugerencias = useMutation({
    mutationFn: () => agregarSugerenciasStock(),
    onSuccess: (resultado) => {
      invalidar()
      toast.success(
        resultado.agregados > 0
          ? `${resultado.agregados} sugerencia(s) agregadas`
          : "No hay ítems con stock bajo",
      )
    },
    onError: () => toast.error("No se pudieron agregar las sugerencias"),
  })

  const pendientes = useMemo(
    () => lista.filter((item) => !item.comprado),
    [lista],
  )
  const comprados = useMemo(
    () => lista.filter((item) => item.comprado),
    [lista],
  )
  const total = pendientes.reduce(
    (suma, item) => suma + (item.precioCentavos ?? 0),
    0,
  )

  const grupos = CATEGORIAS.map((categoria) => ({
    categoria: categoria.valor,
    items: pendientes.filter((item) => item.categoria === categoria.valor),
  })).filter((grupo) => grupo.items.length > 0)

  function abrirNuevo() {
    setEditando(null)
    setDialogoOpen(true)
  }

  function abrirEdicion(item: ItemListaComida) {
    setEditando(item)
    setDialogoOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-outline-variant/60 bg-card p-4 shadow-elevation-1">
        <div>
          <h2 className="text-sm font-black text-heading">Lista de compras</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {pendientes.length} pendientes · {formatMonto(total)} estimado
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-full px-3 text-[10px] font-bold"
            disabled={sugerencias.isPending}
            onClick={() => sugerencias.mutate()}
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            Sugerir stock bajo
          </Button>
          {comprados.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3 text-[10px] font-bold"
              onClick={() => setLimpiarOpen(true)}
            >
              <PackageCheck className="size-3.5" aria-hidden="true" />
              Limpiar comprados
            </Button>
          ) : null}
          <Button
            size="sm"
            className="h-8 rounded-full px-4 text-[10px] font-bold"
            onClick={abrirNuevo}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Agregar ítem
          </Button>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-outline-variant/70 bg-card/50 px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-linen-mist text-forest-ink dark:bg-primary-container dark:text-lime-voltage">
            <ShoppingBasket className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-black text-heading">
              La lista está vacía
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Agregá ítems a mano o generá faltantes desde una receta o el menú.
            </p>
          </div>
          <Button onClick={abrirNuevo}>
            <Plus className="size-4" aria-hidden="true" />
            Agregar el primero
          </Button>
        </div>
      ) : (
        <>
          {grupos.length > 0 ? (
            <div className="flex flex-col gap-3">
              {grupos.map((grupo) => (
                <section
                  key={grupo.categoria}
                  className="overflow-hidden rounded-3xl border border-outline-variant/60 bg-card shadow-elevation-1"
                >
                  <header className="border-b border-outline-variant/40 bg-surface-container-low px-4 py-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                      {etiquetaCategoria(grupo.categoria)}
                    </h3>
                  </header>
                  <ul className="divide-y divide-outline-variant/30">
                    {grupo.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-6 shrink-0 rounded-full"
                          aria-label="Marcar como comprado"
                          onClick={() => toggle.mutate(item)}
                        >
                          <Check className="size-3" />
                        </Button>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-bold text-heading">
                            {item.nombre}
                          </p>
                          <p className="truncate text-[9px] text-muted-foreground">
                            {item.cantidad} {item.unidad} ·{" "}
                            {etiquetaOrigenLista(item.origen)}
                          </p>
                        </div>

                        <span className="tabular text-[10px] font-bold text-muted-foreground">
                          {item.precioCentavos !== null
                            ? formatMonto(item.precioCentavos)
                            : "—"}
                        </span>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-muted-foreground hover:text-heading"
                          aria-label={`Editar ${item.nombre}`}
                          onClick={() => abrirEdicion(item)}
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
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <p className="rounded-3xl border border-outline-variant/50 bg-card px-4 py-8 text-center text-[11px] text-muted-foreground">
              No quedan compras pendientes.
            </p>
          )}

          {comprados.length > 0 ? (
            <section className="overflow-hidden rounded-3xl border border-outline-variant/60 bg-card">
              <header className="border-b border-outline-variant/40 bg-surface-container-low px-4 py-2">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  Comprados · {comprados.length}
                </h3>
              </header>
              <ul className="divide-y divide-outline-variant/30">
                {comprados.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-2 opacity-60"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 text-success"
                      aria-label="Volver a pendiente"
                      onClick={() => toggle.mutate(item)}
                    >
                      <Check className="size-3" />
                    </Button>
                    <p className="min-w-0 flex-1 truncate text-[10px] font-semibold text-heading line-through">
                      {item.nombre}
                    </p>
                    <span className="text-[9px] text-muted-foreground">
                      {item.cantidad} {item.unidad}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-error"
                      aria-label={`Eliminar ${item.nombre}`}
                      onClick={() => setEliminando(item)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}

      {dialogoOpen ? (
        <DialogoItemLista
          key={editando?.id ?? "nuevo"}
          open
          onOpenChange={(open) => {
            if (!open) {
              setDialogoOpen(false)
              setEditando(null)
            }
          }}
          item={editando}
        />
      ) : null}

      <AlertDialog
        open={Boolean(eliminando)}
        onOpenChange={(open) => {
          if (!open) setEliminando(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar de la lista?</AlertDialogTitle>
            <AlertDialogDescription>
              Se va a quitar “{eliminando?.nombre}” de tus compras.
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

      <AlertDialog open={limpiarOpen} onOpenChange={setLimpiarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar los comprados?</AlertDialogTitle>
            <AlertDialogDescription>
              Se van a eliminar los {comprados.length} ítems ya comprados de la
              lista. El stock repuesto queda en la despensa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-error text-paper hover:bg-error/90"
              onClick={() => limpiar.mutate()}
            >
              Borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
