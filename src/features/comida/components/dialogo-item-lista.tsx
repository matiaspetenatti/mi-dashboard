"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Save, ShoppingBasket } from "lucide-react"
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
import {
  CATEGORIAS,
  UNIDADES,
  type CategoriaComida,
  type UnidadComida,
} from "@/features/comida/constantes"
import {
  actualizarItemLista,
  crearItemLista,
} from "@/features/comida/server/functions"
import type {
  ActualizarItemListaInput,
  ItemListaInput,
} from "@/features/comida/schemas"
import type { ItemListaComida } from "@/server/db/schema"

const CAMPO =
  "h-10 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-sm text-heading outline-none focus:border-ring"

export function DialogoItemLista({
  open,
  onOpenChange,
  item,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: ItemListaComida | null
}) {
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState("")
  const [cantidad, setCantidad] = useState("1")
  const [unidad, setUnidad] = useState<UnidadComida>("unidad")
  const [categoria, setCategoria] = useState<CategoriaComida>("otros")
  const [precio, setPrecio] = useState("")

  useEffect(() => {
    if (!open) return
    setNombre(item?.nombre ?? "")
    setCantidad(item ? String(item.cantidad) : "1")
    setUnidad(item ? (item.unidad as UnidadComida) : "unidad")
    setCategoria(item ? (item.categoria as CategoriaComida) : "otros")
    setPrecio(
      item?.precioCentavos !== null && item?.precioCentavos !== undefined
        ? String(item.precioCentavos / 100)
        : "",
    )
  }, [open, item?.id])

  const crear = useMutation({
    mutationFn: (datos: ItemListaInput) => crearItemLista({ data: datos }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["comida"] })
      toast.success("Ítem agregado a la lista")
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "No se pudo agregar el ítem",
      ),
  })

  const editar = useMutation({
    mutationFn: (datos: ActualizarItemListaInput) =>
      actualizarItemLista({ data: datos }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["comida"] })
      toast.success("Ítem actualizado")
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "No se pudo actualizar el ítem",
      ),
  })

  const guardando = crear.isPending || editar.isPending

  function enviar() {
    if (!nombre.trim()) return
    const precioNumero = precio.trim()
      ? Number(precio.replace(",", "."))
      : null
    const datos: ItemListaInput = {
      nombre: nombre.trim(),
      cantidad: Math.max(0.01, Number(cantidad.replace(",", ".")) || 1),
      unidad,
      categoria,
      precioCentavos:
        precioNumero !== null && Number.isFinite(precioNumero)
          ? Math.round(precioNumero * 100)
          : null,
    }
    if (item) {
      editar.mutate({ id: item.id, ...datos })
    } else {
      crear.mutate(datos)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            {item ? "Editar compra" : "Agregar a compras"}
          </DialogTitle>
          <DialogDescription>
            Anotá lo que falta comprar. Al marcarlo como comprado se repone en la
            despensa.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            enviar()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="lista-nombre">Nombre</Label>
            <Input
              id="lista-nombre"
              autoFocus
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Detergente, leche..."
            />
          </div>

          <div className="grid grid-cols-[1fr_1fr] gap-3">
            <div className="space-y-2">
              <Label htmlFor="lista-cantidad">Cantidad</Label>
              <Input
                id="lista-cantidad"
                type="number"
                min="0.01"
                step="any"
                value={cantidad}
                onChange={(event) => setCantidad(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lista-unidad">Unidad</Label>
              <select
                id="lista-unidad"
                value={unidad}
                onChange={(event) =>
                  setUnidad(event.target.value as UnidadComida)
                }
                className={CAMPO}
              >
                {UNIDADES.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lista-categoria">Categoría</Label>
              <select
                id="lista-categoria"
                value={categoria}
                onChange={(event) =>
                  setCategoria(event.target.value as CategoriaComida)
                }
                className={CAMPO}
              >
                {CATEGORIAS.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lista-precio">Precio estimado</Label>
              <Input
                id="lista-precio"
                type="number"
                min="0"
                step="0.01"
                value={precio}
                onChange={(event) => setPrecio(event.target.value)}
                placeholder="Opcional"
              />
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
            <Button type="submit" disabled={guardando || !nombre.trim()}>
              {guardando ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : item ? (
                <Save className="size-4" aria-hidden="true" />
              ) : (
                <ShoppingBasket className="size-4" aria-hidden="true" />
              )}
              {guardando ? "Guardando..." : item ? "Guardar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
