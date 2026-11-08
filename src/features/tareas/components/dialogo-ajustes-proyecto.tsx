"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Archive, Plus, RotateCcw, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { paleta } from "@/features/tareas/constantes"
import {
  actualizarEstado,
  actualizarProyecto,
  crearEstado,
} from "@/features/tareas/server/functions"
import type { ResumenProyecto } from "@/features/tareas/types"
import type { EstadoProyecto } from "@/server/db/schema"
import { cn } from "cn"

const categorias: Array<{ value: EstadoProyecto["categoria"]; label: string }> =
  [
    { value: "pendiente", label: "Pendiente" },
    { value: "en_progreso", label: "En progreso" },
    { value: "completado", label: "Completado" },
    { value: "cancelado", label: "Cancelado" },
  ]

export function DialogoAjustesProyecto({
  open,
  onOpenChange,
  proyecto,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  proyecto: ResumenProyecto | null
}) {
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [color, setColor] = useState<string>(paleta[0])
  const [archivado, setArchivado] = useState(false)

  useEffect(() => {
    if (!open || !proyecto) return
    setNombre(proyecto.proyecto.nombre)
    setDescripcion(proyecto.proyecto.descripcion ?? "")
    setColor(proyecto.proyecto.color)
    setArchivado(proyecto.proyecto.archivado)
  }, [open, proyecto])

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["tareas"] })
  }

  const guardar = useMutation({
    mutationFn: () =>
      actualizarProyecto({
        data: {
          id: proyecto!.proyecto.id,
          nombre,
          descripcion: descripcion.trim() || null,
          color,
          archivado,
        },
      }),
    onSuccess: () => {
      invalidar()
      toast.success("Proyecto actualizado")
      onOpenChange(false)
    },
    onError: () => toast.error("No se pudo actualizar el proyecto"),
  })

  if (!proyecto) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            Ajustes del proyecto
          </DialogTitle>
          <DialogDescription>
            Editá los datos del proyecto y sus estados de trabajo.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!nombre.trim()) return
            guardar.mutate()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="proyecto-edit-nombre">Nombre</Label>
            <Input
              id="proyecto-edit-nombre"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proyecto-edit-descripcion">Descripción</Label>
            <Textarea
              id="proyecto-edit-descripcion"
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
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
                    "size-6 rounded-full border-2 transition-transform hover:scale-110",
                    color === item
                      ? "border-heading ring-2 ring-lime-voltage"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: item }}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="submit"
              disabled={!nombre.trim() || guardar.isPending}
            >
              <Save className="size-4" aria-hidden="true" />
              {guardar.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setArchivado((valor) => !valor)}
            >
              {archivado ? (
                <RotateCcw className="size-4" aria-hidden="true" />
              ) : (
                <Archive className="size-4" aria-hidden="true" />
              )}
              {archivado ? "Reactivar proyecto" : "Archivar proyecto"}
            </Button>
            {archivado ? (
              <span className="text-[10px] font-semibold text-muted-foreground">
                Se guarda como archivado al confirmar.
              </span>
            ) : null}
          </div>
        </form>

        <div className="space-y-3 border-t border-outline-variant/50 pt-4">
          <div>
            <h3 className="text-sm font-black text-heading">Estados</h3>
            <p className="text-[10px] text-muted-foreground">
              El tablero usa estos estados como columnas.
            </p>
          </div>

          <div className="space-y-2">
            {proyecto.estados.map((estado) => (
              <FilaEstado key={estado.id} estado={estado} onSaved={invalidar} />
            ))}
          </div>

          <FormularioEstado
            proyectoId={proyecto.proyecto.id}
            onSaved={invalidar}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FilaEstado({
  estado,
  onSaved,
}: {
  estado: EstadoProyecto
  onSaved: () => void
}) {
  const [nombre, setNombre] = useState(estado.nombre)
  const [color, setColor] = useState(estado.color)
  const [categoria, setCategoria] = useState(estado.categoria)

  const mutation = useMutation({
    mutationFn: () =>
      actualizarEstado({
        data: { id: estado.id, nombre, color, categoria },
      }),
    onSuccess: () => {
      onSaved()
      toast.success("Estado actualizado")
    },
    onError: () => toast.error("No se pudo actualizar el estado"),
  })

  const sinCambios =
    nombre === estado.nombre &&
    color === estado.color &&
    categoria === estado.categoria

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-surface-container-low p-2">
      <input
        type="color"
        value={color}
        onChange={(event) => setColor(event.target.value)}
        aria-label={`Color de ${estado.nombre}`}
        className="size-7 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0"
      />
      <Input
        value={nombre}
        onChange={(event) => setNombre(event.target.value)}
        className="h-8 min-w-[120px] flex-1 text-xs"
      />
      <select
        value={categoria}
        onChange={(event) =>
          setCategoria(event.target.value as EstadoProyecto["categoria"])
        }
        className="h-8 rounded-lg border border-outline-variant/70 bg-card px-2 text-[10px] font-semibold text-muted-foreground outline-none focus:border-ring"
      >
        {categorias.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <Button
        type="button"
        size="icon"
        className="size-8"
        aria-label={`Guardar estado ${estado.nombre}`}
        disabled={sinCambios || !nombre.trim() || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        <Save className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  )
}

function FormularioEstado({
  proyectoId,
  onSaved,
}: {
  proyectoId: number
  onSaved: () => void
}) {
  const [nombre, setNombre] = useState("")
  const [color, setColor] = useState<string>(paleta[0])
  const [categoria, setCategoria] =
    useState<EstadoProyecto["categoria"]>("pendiente")

  const mutation = useMutation({
    mutationFn: () =>
      crearEstado({
        data: { proyectoId, nombre, color, categoria },
      }),
    onSuccess: () => {
      onSaved()
      toast.success("Estado creado")
      setNombre("")
    },
    onError: () => toast.error("No se pudo crear el estado"),
  })

  return (
    <form
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-outline-variant/70 p-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (!nombre.trim()) return
        mutation.mutate()
      }}
    >
      <input
        type="color"
        value={color}
        onChange={(event) => setColor(event.target.value)}
        aria-label="Color del nuevo estado"
        className="size-7 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0"
      />
      <Input
        value={nombre}
        onChange={(event) => setNombre(event.target.value)}
        placeholder="Nuevo estado"
        className="h-8 min-w-[120px] flex-1 text-xs"
      />
      <select
        value={categoria}
        onChange={(event) =>
          setCategoria(event.target.value as EstadoProyecto["categoria"])
        }
        className="h-8 rounded-lg border border-outline-variant/70 bg-card px-2 text-[10px] font-semibold text-muted-foreground outline-none focus:border-ring"
      >
        {categorias.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <Button
        type="submit"
        size="icon"
        className="size-8"
        aria-label="Agregar estado"
        disabled={!nombre.trim() || mutation.isPending}
      >
        <Plus className="size-3.5" aria-hidden="true" />
      </Button>
    </form>
  )
}
