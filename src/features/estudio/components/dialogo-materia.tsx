"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { BookOpen } from "lucide-react"
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
  actualizarMateria,
  crearMateria,
} from "@/features/estudio/server/functions"
import {
  aniosMateria,
  etiquetasCuatrimestre,
  etiquetasEstadoMateria,
} from "@/features/estudio/constantes"
import type {
  Cuatrimestre,
  EstadoMateria,
  Materia,
} from "@/server/db/schema"

export function DialogoMateria({
  open,
  onOpenChange,
  carreraId,
  materia,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  carreraId: number
  materia?: Materia | null
}) {
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState("")
  const [anio, setAnio] = useState("")
  const [cuatrimestre, setCuatrimestre] = useState<Cuatrimestre | "">("")
  const [estado, setEstado] = useState<EstadoMateria>("pendiente")
  const [notaFinal, setNotaFinal] = useState("")
  const [creditos, setCreditos] = useState("")
  const [profesor, setProfesor] = useState("")
  const [notas, setNotas] = useState("")

  useEffect(() => {
    if (!open) return
    setNombre(materia?.nombre ?? "")
    setAnio(materia?.anio ? String(materia.anio) : "")
    setCuatrimestre(materia?.cuatrimestre ?? "")
    setEstado(materia?.estado ?? "pendiente")
    setNotaFinal(materia?.notaFinal != null ? String(materia.notaFinal) : "")
    setCreditos(materia?.creditos != null ? String(materia.creditos) : "")
    setProfesor(materia?.profesor ?? "")
    setNotas(materia?.notas ?? "")
  }, [open, materia])

  const mutation = useMutation<{ id?: number; ok?: boolean }>({
    mutationFn: () => {
      const data = {
        carreraId,
        nombre,
        anio: anio ? Number(anio) : null,
        cuatrimestre: cuatrimestre || null,
        creditos: creditos ? Number(creditos) : null,
        estado,
        notaFinal: notaFinal ? Number(notaFinal) : null,
        profesor: profesor.trim() || null,
        notas: notas.trim() || null,
      }
      return materia
        ? actualizarMateria({ data: { id: materia.id, ...data } })
        : crearMateria({ data })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["estudio"] })
      toast.success(materia ? "Materia actualizada" : "Materia creada")
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "No se pudo guardar la materia",
      )
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            {materia ? "Editar materia" : "Nueva materia"}
          </DialogTitle>
          <DialogDescription>
            Estado, nota y datos relevantes de la materia.
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
            <Label htmlFor="materia-nombre">Nombre</Label>
            <Input
              id="materia-nombre"
              autoFocus
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Programación I"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="materia-anio">Año</Label>
              <select
                id="materia-anio"
                value={anio}
                onChange={(event) => setAnio(event.target.value)}
                className="h-10 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-sm text-heading outline-none focus:border-ring"
              >
                <option value="">Sin año</option>
                {aniosMateria.map((item) => (
                  <option key={item} value={item}>
                    {item}° año
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="materia-cuatrimestre">Cuatrimestre</Label>
              <select
                id="materia-cuatrimestre"
                value={cuatrimestre}
                onChange={(event) =>
                  setCuatrimestre(event.target.value as Cuatrimestre | "")
                }
                className="h-10 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-sm text-heading outline-none focus:border-ring"
              >
                <option value="">Sin definir</option>
                {Object.entries(etiquetasCuatrimestre).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="materia-estado">Estado</Label>
              <select
                id="materia-estado"
                value={estado}
                onChange={(event) =>
                  setEstado(event.target.value as EstadoMateria)
                }
                className="h-10 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-sm text-heading outline-none focus:border-ring"
              >
                {Object.entries(etiquetasEstadoMateria).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="materia-nota">Nota final</Label>
              <Input
                id="materia-nota"
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={notaFinal}
                onChange={(event) => setNotaFinal(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="materia-creditos">Créditos</Label>
              <Input
                id="materia-creditos"
                type="number"
                min="0"
                max="1000"
                value={creditos}
                onChange={(event) => setCreditos(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="materia-profesor">Profesor</Label>
            <Input
              id="materia-profesor"
              value={profesor}
              onChange={(event) => setProfesor(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="materia-notas">Notas</Label>
            <Textarea
              id="materia-notas"
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
              rows={2}
              placeholder="Información relevante, apuntes, links..."
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
                  <BookOpen className="size-4" aria-hidden="true" />
                  {materia ? "Guardar" : "Crear materia"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
