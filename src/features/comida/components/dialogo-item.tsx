"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2, Package, Save } from "lucide-react"
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
import {
  CATEGORIAS,
  UBICACIONES,
  UNIDADES,
  type CategoriaComida,
  type UnidadComida,
} from "@/features/comida/constantes"
import {
  actualizarItemComida,
  crearItemComida,
} from "@/features/comida/server/functions"
import type {
  ActualizarItemComidaInput,
  ItemComidaInput,
} from "@/features/comida/schemas"
import type { ItemComida, UbicacionComida } from "@/server/db/schema"
import { cn } from "cn"

const CAMPO =
  "h-10 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-sm text-heading outline-none focus:border-ring"

export function DialogoItem({
  open,
  onOpenChange,
  item,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: ItemComida | null
}) {
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState("")
  const [tipo, setTipo] = useState<"ingrediente" | "utensilio">("ingrediente")
  const [categoria, setCategoria] = useState<CategoriaComida>("otros")
  const [cantidad, setCantidad] = useState("0")
  const [unidad, setUnidad] = useState<UnidadComida>("unidad")
  const [ubicacion, setUbicacion] = useState<UbicacionComida>("despensa")
  const [caducaEn, setCaducaEn] = useState("")
  const [stockMinimo, setStockMinimo] = useState("")
  const [notas, setNotas] = useState("")

  useEffect(() => {
    if (!open) return
    setNombre(item?.nombre ?? "")
    setTipo(item?.tipo ?? "ingrediente")
    setCategoria(item ? (item.categoria as CategoriaComida) : "otros")
    setCantidad(item ? String(item.cantidad) : "0")
    setUnidad(item ? (item.unidad as UnidadComida) : "unidad")
    setUbicacion(item?.ubicacion ?? "despensa")
    setCaducaEn(item?.caducaEn ?? "")
    setStockMinimo(
      item?.stockMinimo !== null && item?.stockMinimo !== undefined
        ? String(item.stockMinimo)
        : "",
    )
    setNotas(item?.notas ?? "")
  }, [open, item?.id])

  const crear = useMutation({
    mutationFn: (datos: ItemComidaInput) => crearItemComida({ data: datos }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["comida"] })
      toast.success("Ítem agregado")
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "No se pudo guardar el ítem",
      ),
  })

  const editar = useMutation({
    mutationFn: (datos: ActualizarItemComidaInput) =>
      actualizarItemComida({ data: datos }),
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

  function numero(valor: string): number | null {
    const texto = valor.trim().replace(",", ".")
    if (!texto) return null
    const n = Number(texto)
    return Number.isFinite(n) ? n : null
  }

  function enviar() {
    if (!nombre.trim()) return
    const esUtensilio = tipo === "utensilio"
    const datos: ItemComidaInput = {
      nombre: nombre.trim(),
      tipo,
      categoria: esUtensilio ? "bar" : categoria,
      cantidad: esUtensilio ? 0 : Math.max(0, numero(cantidad) ?? 0),
      unidad: esUtensilio ? "unidad" : unidad,
      ubicacion: esUtensilio ? "bar" : ubicacion,
      caducaEn: esUtensilio ? null : caducaEn || null,
      stockMinimo: esUtensilio ? null : numero(stockMinimo),
      notas: notas.trim() || null,
    }
    if (item) {
      editar.mutate({ id: item.id, ...datos })
    } else {
      crear.mutate(datos)
    }
  }

  const esUtensilio = tipo === "utensilio"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            {item ? "Editar ítem" : "Nuevo ítem"}
          </DialogTitle>
          <DialogDescription>
            Cargá lo que tenés en la despensa, heladera, freezer o barra.
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
            <Label htmlFor="item-nombre">Nombre</Label>
            <Input
              id="item-nombre"
              autoFocus
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Arroz, huevos, gin..."
            />
          </div>

          <div className="flex gap-1 rounded-full border border-outline-variant/60 bg-surface-container-low p-1">
            {(
              [
                ["ingrediente", "Ingrediente"],
                ["utensilio", "Utensilio de bar"],
              ] as const
            ).map(([valor, etiqueta]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setTipo(valor)}
                className={cn(
                  "flex-1 rounded-full px-3 py-1.5 text-[10px] font-bold transition-colors",
                  tipo === valor
                    ? "bg-forest-ink text-paper dark:bg-lime-voltage dark:text-forest-ink"
                    : "text-muted-foreground hover:text-heading",
                )}
              >
                {etiqueta}
              </button>
            ))}
          </div>

          {!esUtensilio ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="item-categoria">Categoría</Label>
                  <select
                    id="item-categoria"
                    value={categoria}
                    onChange={(event) =>
                      setCategoria(event.target.value as CategoriaComida)
                    }
                    className={CAMPO}
                  >
                    {CATEGORIAS.map((opcion) => (
                      <option key={opcion.valor} value={opcion.valor}>
                        {opcion.emoji} {opcion.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-ubicacion">Ubicación</Label>
                  <select
                    id="item-ubicacion"
                    value={ubicacion}
                    onChange={(event) =>
                      setUbicacion(event.target.value as UbicacionComida)
                    }
                    className={CAMPO}
                  >
                    {UBICACIONES.map((opcion) => (
                      <option key={opcion.valor} value={opcion.valor}>
                        {opcion.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_1fr] gap-3">
                <div className="space-y-2">
                  <Label htmlFor="item-cantidad">Cantidad</Label>
                  <Input
                    id="item-cantidad"
                    type="number"
                    min="0"
                    step="0.5"
                    value={cantidad}
                    onChange={(event) => setCantidad(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-unidad">Unidad</Label>
                  <select
                    id="item-unidad"
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
                  <Label htmlFor="item-caduca">Vence</Label>
                  <Input
                    id="item-caduca"
                    type="date"
                    value={caducaEn}
                    onChange={(event) => setCaducaEn(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-minimo">Stock mínimo</Label>
                  <Input
                    id="item-minimo"
                    type="number"
                    min="0"
                    step="0.5"
                    value={stockMinimo}
                    onChange={(event) => setStockMinimo(event.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="rounded-2xl bg-surface-container-low px-3 py-2 text-[10px] text-muted-foreground">
              Los utensilios se guardan en la barra y no tienen stock ni
              vencimiento.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="item-notas">Notas</Label>
            <Textarea
              id="item-notas"
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
              rows={2}
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
            <Button type="submit" disabled={guardando || !nombre.trim()}>
              {guardando ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : item ? (
                <Save className="size-4" aria-hidden="true" />
              ) : (
                <Package className="size-4" aria-hidden="true" />
              )}
              {guardando ? "Guardando..." : item ? "Guardar" : "Agregar ítem"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
