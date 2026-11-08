"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarDays, ClipboardList } from "lucide-react"
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
  actualizarExamen,
  crearExamen,
} from "@/features/estudio/server/functions"
import {
  etiquetasEstadoExamen,
  etiquetasResultadoExamen,
  etiquetasTipoExamen,
} from "@/features/estudio/constantes"
import type {
  EstadoExamen,
  Materia,
  ResultadoExamen,
  TipoExamen,
} from "@/server/db/schema"
import type { ExamenConContexto } from "@/features/estudio/types"
import { fechaHoy } from "@/lib/dates"

export function DialogoExamen({
  open,
  onOpenChange,
  materias,
  examen,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  materias: Materia[]
  examen?: ExamenConContexto | null
}) {
  const queryClient = useQueryClient()
  const [materiaId, setMateriaId] = useState<number | null>(null)
  const [tipo, setTipo] = useState<TipoExamen>("parcial")
  const [titulo, setTitulo] = useState("")
  const [fecha, setFecha] = useState(fechaHoy())
  const [estado, setEstado] = useState<EstadoExamen>("programado")
  const [nota, setNota] = useState("")
  const [resultado, setResultado] = useState<ResultadoExamen | "">("")
  const [observaciones, setObservaciones] = useState("")

  useEffect(() => {
    if (!open) return
    setMateriaId(examen?.materiaId ?? materias.at(0)?.id ?? null)
    setTipo(examen?.tipo ?? "parcial")
    setTitulo(examen?.titulo ?? "")
    setFecha(examen?.fecha ?? fechaHoy())
    setEstado(examen?.estado ?? "programado")
    setNota(examen?.nota != null ? String(examen.nota) : "")
    setResultado(examen?.resultado ?? "")
    setObservaciones(examen?.observaciones ?? "")
  }, [open, examen, materias])

  const mutation = useMutation<{ id?: number; ok?: boolean }>({
    mutationFn: () => {
      if (!materiaId) throw new Error("Elegí una materia")
      const data = {
        materiaId,
        tipo,
        titulo: titulo.trim() || null,
        fecha,
        nota: nota ? Number(nota) : null,
        resultado: resultado || null,
        estado,
        observaciones: observaciones.trim() || null,
      }
      return examen
        ? actualizarExamen({ data: { id: examen.id, ...data } })
        : crearExamen({ data })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["estudio"] })
      toast.success(examen ? "Examen actualizado" : "Examen creado")
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "No se pudo guardar el examen",
      )
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            {examen ? "Editar examen" : "Nuevo examen"}
          </DialogTitle>
          <DialogDescription>
            Programá o cargá el resultado de un examen.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!materiaId || !fecha) return
            mutation.mutate()
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="examen-materia">Materia</Label>
              <select
                id="examen-materia"
                value={materiaId ?? ""}
                onChange={(event) => setMateriaId(Number(event.target.value))}
                className="h-10 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-sm text-heading outline-none focus:border-ring"
              >
                {materias.map((materia) => (
                  <option key={materia.id} value={materia.id}>
                    {materia.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="examen-tipo">Tipo</Label>
              <select
                id="examen-tipo"
                value={tipo}
                onChange={(event) => setTipo(event.target.value as TipoExamen)}
                className="h-10 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-sm text-heading outline-none focus:border-ring"
              >
                {Object.entries(etiquetasTipoExamen).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="examen-titulo">Título</Label>
            <Input
              id="examen-titulo"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Parcial 1, Final, TP..."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="examen-fecha">Fecha</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="examen-fecha"
                  type="date"
                  className="pl-9"
                  value={fecha}
                  onChange={(event) => setFecha(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="examen-estado">Estado</Label>
              <select
                id="examen-estado"
                value={estado}
                onChange={(event) =>
                  setEstado(event.target.value as EstadoExamen)
                }
                className="h-10 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-sm text-heading outline-none focus:border-ring"
              >
                {Object.entries(etiquetasEstadoExamen).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="examen-nota">Nota</Label>
              <Input
                id="examen-nota"
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={nota}
                onChange={(event) => setNota(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="examen-resultado">Resultado</Label>
              <select
                id="examen-resultado"
                value={resultado}
                onChange={(event) =>
                  setResultado(event.target.value as ResultadoExamen | "")
                }
                className="h-10 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-sm text-heading outline-none focus:border-ring"
              >
                <option value="">Sin resultado</option>
                {Object.entries(etiquetasResultadoExamen).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="examen-observaciones">Observaciones</Label>
            <Textarea
              id="examen-observaciones"
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
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
            <Button
              type="submit"
              disabled={!materiaId || !fecha || mutation.isPending}
            >
              <ClipboardList className="size-4" aria-hidden="true" />
              {mutation.isPending
                ? "Guardando..."
                : examen
                  ? "Guardar"
                  : "Crear examen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
