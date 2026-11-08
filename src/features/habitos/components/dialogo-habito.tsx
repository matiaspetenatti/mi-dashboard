"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Activity, Loader2, Save } from "lucide-react"
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
  COLORES_HABITO,
  TIPOS_HABITO,
} from "@/features/habitos/constantes"
import {
  crearHabito,
  actualizarHabito,
} from "@/features/habitos/server/functions"
import type {
  ActualizarHabitoInput,
  CrearHabitoInput,
} from "@/features/habitos/schemas"
import type { Habito } from "@/server/db/schema"
import { cn } from "cn"

export function DialogoHabito({
  open,
  onOpenChange,
  habito,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  habito?: Habito | null
}) {
  const queryClient = useQueryClient()
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [tipo, setTipo] = useState<"bueno" | "malo">("bueno")
  const [color, setColor] = useState("#163300")
  const [emoji, setEmoji] = useState("")

  useEffect(() => {
    if (!open) return
    setTitulo(habito?.titulo ?? "")
    setDescripcion(habito?.descripcion ?? "")
    setTipo(habito?.tipo ?? "bueno")
    setColor(habito?.color ?? "#163300")
    setEmoji(habito?.emoji ?? "")
  }, [open, habito?.id])

  const crear = useMutation({
    mutationFn: (datos: CrearHabitoInput) => crearHabito({ data: datos }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["habitos"] })
      toast.success("Hábito creado")
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "No se pudo crear el hábito",
      ),
  })

  const editar = useMutation({
    mutationFn: (datos: ActualizarHabitoInput) =>
      actualizarHabito({ data: datos }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["habitos"] })
      toast.success("Hábito actualizado")
      onOpenChange(false)
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "No se pudo actualizar el hábito",
      ),
  })

  const guardando = crear.isPending || editar.isPending

  function enviar() {
    if (!titulo.trim()) return
    const datos = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      tipo,
      color,
      emoji: emoji.trim() || null,
      frecuencia: "diaria" as const,
    }

    if (habito) {
      editar.mutate({ id: habito.id, ...datos })
    } else {
      crear.mutate({ ...datos, activo: true })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            {habito ? "Editar hábito" : "Nuevo hábito"}
          </DialogTitle>
          <DialogDescription>
            Elegí qué querés construir o dejar de hacer.
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
            <Label htmlFor="habito-titulo">Título</Label>
            <Input
              id="habito-titulo"
              autoFocus
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Leer 20 páginas, no fumar..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="habito-descripcion">Descripción</Label>
            <Textarea
              id="habito-descripcion"
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              rows={2}
              placeholder="¿Qué querés lograr con este hábito?"
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="flex gap-1">
              {TIPOS_HABITO.map((opcion) => (
                <button
                  key={opcion.valor}
                  type="button"
                  onClick={() => setTipo(opcion.valor)}
                  className={cn(
                    "flex-1 rounded-full px-3 py-2 text-[10px] font-bold transition-colors",
                    tipo === opcion.valor
                      ? opcion.clase
                      : "bg-surface-container-low text-muted-foreground hover:text-heading",
                  )}
                >
                  {opcion.etiqueta}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-muted-foreground">
              {TIPOS_HABITO.find((opcion) => opcion.valor === tipo)?.descripcion}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORES_HABITO.map((opcion) => (
                <button
                  key={opcion.valor}
                  type="button"
                  aria-label={opcion.etiqueta}
                  onClick={() => setColor(opcion.valor)}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform hover:scale-110",
                    color === opcion.valor
                      ? "border-heading ring-2 ring-lime-voltage"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: opcion.valor }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="habito-emoji">Emoji (opcional)</Label>
            <Input
              id="habito-emoji"
              value={emoji}
              onChange={(event) => setEmoji(event.target.value)}
              maxLength={8}
              placeholder="📚"
              className="w-24 text-center"
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
            <Button type="submit" disabled={guardando || !titulo.trim()}>
              {guardando ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : habito ? (
                <Save className="size-4" aria-hidden="true" />
              ) : (
                <Activity className="size-4" aria-hidden="true" />
              )}
              {guardando
                ? "Guardando..."
                : habito
                  ? "Guardar"
                  : "Crear hábito"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
