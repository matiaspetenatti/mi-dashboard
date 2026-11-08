"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { FolderPlus } from "lucide-react"
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
import { crearProyecto } from "@/features/tareas/server/functions"
import { paleta } from "@/features/tareas/constantes"
import { cn } from "cn"

export function DialogoProyecto({
  open,
  onOpenChange,
  onCreado,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreado?: (slug: string) => void
}) {
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [color, setColor] = useState<string>(paleta[0])

  useEffect(() => {
    if (!open) return
    setNombre("")
    setDescripcion("")
    setColor(paleta[0])
  }, [open])

  const mutation = useMutation({
    mutationFn: () =>
      crearProyecto({
        data: {
          nombre,
          descripcion: descripcion.trim() || null,
          color,
          icono: "carpeta",
        },
      }),
    onSuccess: (proyecto) => {
      void queryClient.invalidateQueries({ queryKey: ["tareas"] })
      toast.success("Proyecto creado")
      onOpenChange(false)
      onCreado?.(proyecto.slug)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "No se pudo crear el proyecto",
      )
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            Nuevo proyecto
          </DialogTitle>
          <DialogDescription>
            Cada proyecto tiene sus propios estados y etiquetas.
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
            <Label htmlFor="proyecto-nombre">Nombre</Label>
            <Input
              id="proyecto-nombre"
              autoFocus
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Casa, Trabajo, Facultad..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proyecto-descripcion">Descripción</Label>
            <Textarea
              id="proyecto-descripcion"
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              placeholder="Opcional"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {paleta.map((item) => (
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
              disabled={!nombre.trim() || mutation.isPending}
            >
              <FolderPlus className="size-4" aria-hidden="true" />
              {mutation.isPending ? "Creando..." : "Crear proyecto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
