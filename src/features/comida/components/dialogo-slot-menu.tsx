"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarDays, Loader2, Save, Trash2 } from "lucide-react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { NutricionEditor } from "@/features/comida/components/nutricion-editor"
import {
  nutricionDesdeForm,
  nutricionFormDesde,
  nutricionFormVacia,
  type CampoNutricion,
  type NutricionForm,
} from "@/features/comida/lib/nutricion"
import { etiquetaDiaLargo } from "@/features/comida/lib/semana"
import { etiquetaMomento } from "@/features/comida/constantes"
import {
  eliminarSlotMenu,
  guardarSlotMenu,
} from "@/features/comida/server/functions"
import type { SlotMenuInput } from "@/features/comida/schemas"
import type {
  MomentoMenu,
  RecetaComida,
  SlotMenuComida,
} from "@/server/db/schema"

export function DialogoSlotMenu({
  open,
  onOpenChange,
  dia,
  momento,
  recetas,
  slot,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  dia: string
  momento: MomentoMenu
  recetas: RecetaComida[]
  slot?: SlotMenuComida | null
}) {
  const queryClient = useQueryClient()
  const [recetaId, setRecetaId] = useState("0")
  const [titulo, setTitulo] = useState("")
  const [minutos, setMinutos] = useState("")
  const [ingredientes, setIngredientes] = useState("")
  const [reutiliza, setReutiliza] = useState("")
  const [nutricionActiva, setNutricionActiva] = useState(false)
  const [nutricion, setNutricion] =
    useState<NutricionForm>(nutricionFormVacia)

  useEffect(() => {
    if (!open) return
    setRecetaId(slot?.recetaId ? String(slot.recetaId) : "0")
    setTitulo(slot?.titulo ?? "")
    setMinutos(slot?.minutos !== null && slot?.minutos !== undefined ? String(slot.minutos) : "")
    setIngredientes((slot?.ingredientes ?? []).join("\n"))
    setReutiliza(slot?.reutiliza ?? "")
    setNutricionActiva(Boolean(slot?.nutricion))
    setNutricion(nutricionFormDesde(slot?.nutricion))
  }, [open, dia, momento, slot?.id])

  const recetaSeleccionada = useMemo(
    () => recetas.find((receta) => receta.id === Number(recetaId)) ?? null,
    [recetas, recetaId],
  )

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["comida"] })
  }

  const guardar = useMutation({
    mutationFn: (datos: SlotMenuInput) => guardarSlotMenu({ data: datos }),
    onSuccess: () => {
      invalidar()
      toast.success("Plato guardado en el menú")
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "No se pudo guardar el plato",
      ),
  })

  const eliminar = useMutation({
    mutationFn: () => {
      if (!slot) throw new Error("No hay un plato para quitar")
      return eliminarSlotMenu({ data: { id: slot.id } })
    },
    onSuccess: () => {
      invalidar()
      toast.success("Plato quitado del menú")
      onOpenChange(false)
    },
    onError: () => toast.error("No se pudo quitar el plato"),
  })

  function enviar() {
    const id = Number(recetaId) || null
    if (!id && titulo.trim().length < 2) {
      toast.error("Elegí una receta o escribí un título")
      return
    }

    guardar.mutate({
      id: slot?.id,
      dia,
      momento,
      recetaId: id,
      titulo: titulo.trim() || null,
      minutos: minutos ? Math.max(1, Number(minutos)) : null,
      ingredientes: ingredientes
        .split("\n")
        .map((linea) => linea.trim())
        .filter(Boolean),
      nutricion: recetaSeleccionada
        ? recetaSeleccionada.nutricion
        : nutricionActiva
          ? nutricionDesdeForm(nutricion)
          : null,
      reutiliza: reutiliza.trim() || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            {slot ? "Editar plato" : "Agregar plato"} ·{" "}
            {etiquetaMomento(momento)}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {etiquetaDiaLargo(dia)}
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
            <Label htmlFor="slot-receta">Receta del recetario</Label>
            <Select
              value={recetaId}
              onValueChange={(valor) => setRecetaId(valor ?? "0")}
              items={[
                { value: "0", label: "Plato libre" },
                ...recetas.map((receta) => ({
                  value: String(receta.id),
                  label: receta.titulo,
                })),
              ]}
            >
              <SelectTrigger
                id="slot-receta"
                className="h-10 w-full rounded-xl border-outline-variant/70 bg-card px-3 text-sm text-heading"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Plato libre</SelectItem>
                {recetas.map((receta) => (
                  <SelectItem key={receta.id} value={String(receta.id)}>
                    {receta.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {recetaSeleccionada ? (
            <p className="rounded-2xl bg-surface-container-low px-3 py-2 text-[10px] text-muted-foreground">
              Se van a copiar {recetaSeleccionada.ingredientes.length}{" "}
              ingredientes y {recetaSeleccionada.minutos} minutos desde el
              recetario.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="slot-titulo">Título</Label>
                <Input
                  id="slot-titulo"
                  value={titulo}
                  onChange={(event) => setTitulo(event.target.value)}
                  placeholder="Qué vas a comer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slot-minutos">Minutos</Label>
                <Input
                  id="slot-minutos"
                  type="number"
                  min="1"
                  max="600"
                  value={minutos}
                  onChange={(event) => setMinutos(event.target.value)}
                  placeholder="Opcional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slot-ingredientes">
                  Ingredientes (uno por línea)
                </Label>
                <Textarea
                  id="slot-ingredientes"
                  value={ingredientes}
                  onChange={(event) => setIngredientes(event.target.value)}
                  rows={4}
                  placeholder={"500 g de pollo\n2 tomates"}
                />
              </div>
            </>
          )}

          {recetaSeleccionada ? (
            <p className="rounded-2xl bg-surface-container-low px-3 py-2 text-[10px] text-muted-foreground">
              {recetaSeleccionada.nutricion
                ? `Nutrición de la receta: ${Math.round(
                    recetaSeleccionada.nutricion.kcal,
                  )} kcal · ${Math.round(
                    recetaSeleccionada.nutricion.proteinas,
                  )} g proteínas · ${Math.round(
                    recetaSeleccionada.nutricion.carbos,
                  )} g carbos · ${Math.round(
                    recetaSeleccionada.nutricion.grasas,
                  )} g grasas.`
                : "La receta no tiene datos nutricionales cargados."}
            </p>
          ) : (
            <NutricionEditor
              idPrefix="slot"
              activa={nutricionActiva}
              onActivaChange={setNutricionActiva}
              valores={nutricion}
              onChange={(campo: CampoNutricion, valor: string) =>
                setNutricion((anterior) => ({ ...anterior, [campo]: valor }))
              }
              descripcion="Opcional. Se suma al total diario y semanal."
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="slot-reutiliza">Reutiliza / nota</Label>
            <Input
              id="slot-reutiliza"
              value={reutiliza}
              onChange={(event) => setReutiliza(event.target.value)}
              placeholder="Ej: sobras del lunes"
            />
          </div>

          <DialogFooter showCloseButton={false}>
            {slot ? (
              <Button
                type="button"
                variant="outline"
                className="mr-auto border-error/30 text-error hover:bg-error-container hover:text-error"
                disabled={eliminar.isPending}
                onClick={() => eliminar.mutate()}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Quitar
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={guardar.isPending}>
              {guardar.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              {guardar.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
