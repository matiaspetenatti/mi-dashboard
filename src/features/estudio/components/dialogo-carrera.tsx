"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { GraduationCap } from "lucide-react"
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
  actualizarCarrera,
  crearCarrera,
} from "@/features/estudio/server/functions"
import {
  etiquetasEstadoCarrera,
  paletaCarreras,
} from "@/features/estudio/constantes"
import type { Carrera, EstadoCarrera } from "@/server/db/schema"
import { cn } from "cn"

export function DialogoCarrera({
  open,
  onOpenChange,
  carrera,
  onCreada,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  carrera?: Carrera | null
  onCreada?: (id: number) => void
}) {
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState("")
  const [institucion, setInstitucion] = useState("")
  const [estado, setEstado] = useState<EstadoCarrera>("cursando")
  const [anioInicio, setAnioInicio] = useState("")
  const [anioFin, setAnioFin] = useState("")
  const [materiasTotales, setMateriasTotales] = useState("")
  const [color, setColor] = useState<string>(paletaCarreras[0])
  const [notas, setNotas] = useState("")

  useEffect(() => {
    if (!open) return
    setNombre(carrera?.nombre ?? "")
    setInstitucion(carrera?.institucion ?? "")
    setEstado(carrera?.estado ?? "cursando")
    setAnioInicio(carrera?.anioInicio ? String(carrera.anioInicio) : "")
    setAnioFin(carrera?.anioFin ? String(carrera.anioFin) : "")
    setMateriasTotales(
      carrera?.materiasTotales ? String(carrera.materiasTotales) : "",
    )
    setColor(carrera?.color ?? paletaCarreras[0])
    setNotas(carrera?.notas ?? "")
  }, [open, carrera])

  const mutation = useMutation<{ id?: number; ok?: boolean }>({
    mutationFn: () => {
      const data = {
        nombre,
        institucion: institucion.trim() || null,
        estado,
        anioInicio: anioInicio ? Number(anioInicio) : null,
        anioFin: anioFin ? Number(anioFin) : null,
        materiasTotales: materiasTotales ? Number(materiasTotales) : null,
        color,
        notas: notas.trim() || null,
      }
      return carrera
        ? actualizarCarrera({ data: { id: carrera.id, ...data } })
        : crearCarrera({ data })
    },
    onSuccess: (resultado) => {
      void queryClient.invalidateQueries({ queryKey: ["estudio"] })
      toast.success(carrera ? "Carrera actualizada" : "Carrera creada")
      onOpenChange(false)
      if (!carrera && resultado.id) onCreada?.(resultado.id)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "No se pudo guardar la carrera",
      )
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            {carrera ? "Editar carrera" : "Nueva carrera"}
          </DialogTitle>
          <DialogDescription>
            Cargá los datos principales de tu carrera.
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
            <Label htmlFor="carrera-nombre">Nombre</Label>
            <Input
              id="carrera-nombre"
              autoFocus
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Tecnicatura en Desarrollo de Software"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="carrera-institucion">Institución</Label>
              <Input
                id="carrera-institucion"
                value={institucion}
                onChange={(event) => setInstitucion(event.target.value)}
                placeholder="Universidad, instituto..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carrera-estado">Estado</Label>
              <select
                id="carrera-estado"
                value={estado}
                onChange={(event) =>
                  setEstado(event.target.value as EstadoCarrera)
                }
                className="h-10 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-sm text-heading outline-none focus:border-ring"
              >
                {Object.entries(etiquetasEstadoCarrera).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="carrera-inicio">Año inicio</Label>
              <Input
                id="carrera-inicio"
                type="number"
                min="1900"
                max="2200"
                value={anioInicio}
                onChange={(event) => setAnioInicio(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carrera-fin">Año fin</Label>
              <Input
                id="carrera-fin"
                type="number"
                min="1900"
                max="2200"
                value={anioFin}
                onChange={(event) => setAnioFin(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carrera-total">Materias del plan</Label>
              <Input
                id="carrera-total"
                type="number"
                min="1"
                max="500"
                value={materiasTotales}
                onChange={(event) => setMateriasTotales(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {paletaCarreras.map((item) => (
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

          <div className="space-y-2">
            <Label htmlFor="carrera-notas">Notas</Label>
            <Textarea
              id="carrera-notas"
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
              rows={2}
              placeholder="Información relevante de la carrera"
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
            <Button type="submit" disabled={!nombre.trim() || mutation.isPending}>
              {mutation.isPending ? (
                "Guardando..."
              ) : (
                <>
                  <GraduationCap className="size-4" aria-hidden="true" />
                  {carrera ? "Guardar" : "Crear carrera"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
