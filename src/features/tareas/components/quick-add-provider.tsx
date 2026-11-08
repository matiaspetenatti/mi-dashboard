"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createContext, useContext, useState, type ReactNode } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { CalendarDays, Plus } from "lucide-react"

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
import { crearTareaRapida } from "@/features/tareas/server/functions"
import {
  crearTareaRapidaSchema,
  prioridadesTarea,
  type CrearTareaRapidaInput,
} from "@/features/tareas/schemas"
import { cn } from "cn"

const QuickAddContext = createContext<{ open: () => void } | null>(null)

export function useQuickAdd() {
  const context = useContext(QuickAddContext)
  if (!context) {
    throw new Error("useQuickAdd debe usarse dentro de QuickAddProvider")
  }
  return context
}

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <QuickAddContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <QuickAddDialog open={open} onOpenChange={setOpen} />
    </QuickAddContext.Provider>
  )
}

function QuickAddDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CrearTareaRapidaInput>({
    resolver: zodResolver(crearTareaRapidaSchema),
    defaultValues: {
      titulo: "",
      fechaLimite: null,
      prioridad: null,
    },
  })

  const prioridad = watch("prioridad")

  const mutation = useMutation({
    mutationFn: (values: CrearTareaRapidaInput) =>
      crearTareaRapida({
        data: {
          ...values,
          fechaLimite: values.fechaLimite || null,
          prioridad: values.prioridad || null,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tareas"] })
      toast.success("Tarea creada")
      reset()
      onOpenChange(false)
    },
    onError: () => {
      toast.error("No se pudo crear la tarea")
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            Nueva tarea
          </DialogTitle>
          <DialogDescription>
            Se guarda en tu proyecto activo. Después podés moverla desde Tareas.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="space-y-2">
            <Label htmlFor="quick-titulo">Título</Label>
            <Input
              id="quick-titulo"
              placeholder="¿Qué tenés que hacer?"
              autoFocus
              aria-invalid={Boolean(errors.titulo)}
              {...register("titulo")}
            />
            {errors.titulo ? (
              <p className="text-xs font-medium text-error">
                {errors.titulo.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-fecha">Fecha límite</Label>
            <div className="relative">
              <CalendarDays
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="quick-fecha"
                type="date"
                className="pl-9"
                {...register("fechaLimite")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Prioridad</Label>
            <div className="flex flex-wrap gap-2">
              {prioridadesTarea.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setValue("prioridad", prioridad === item ? null : item, {
                      shouldDirty: true,
                    })
                  }
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[11px] font-bold capitalize transition-colors",
                    prioridad === item
                      ? "border-forest-ink bg-forest-ink text-paper dark:border-lime-voltage dark:bg-lime-voltage dark:text-forest-ink"
                      : "border-outline-variant/70 bg-card text-muted-foreground hover:bg-muted hover:text-heading",
                  )}
                >
                  {item}
                </button>
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
            <Button type="submit" disabled={mutation.isPending}>
              <Plus className="size-4" aria-hidden="true" />
              {mutation.isPending ? "Creando..." : "Crear tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
