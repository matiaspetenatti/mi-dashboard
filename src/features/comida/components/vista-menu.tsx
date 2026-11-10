"use client"

import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Plus,
  ShoppingBasket,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { DialogoSlotMenu } from "@/features/comida/components/dialogo-slot-menu"
import { MOMENTOS } from "@/features/comida/constantes"
import {
  etiquetaDiaCorto,
  esHoy,
  rangoSemana,
  tituloSemana,
} from "@/features/comida/lib/semana"
import {
  CAMPOS_NUTRICION,
  sumarNutricion,
} from "@/features/comida/lib/nutricion"
import {
  agregarFaltantesMenu,
  alternarSlotHecho,
  limpiarSemanaComida,
} from "@/features/comida/server/functions"
import type {
  MomentoMenu,
  RecetaComida,
  SlotMenuComida,
} from "@/server/db/schema"
import { sumarFecha } from "@/lib/dates"
import { cn } from "cn"

export function VistaMenu({
  dias,
  menu,
  recetas,
  semana,
  hoy,
  onCambiarSemana,
}: {
  dias: string[]
  menu: SlotMenuComida[]
  recetas: RecetaComida[]
  semana: string
  hoy: string
  onCambiarSemana: (semana: string) => void
}) {
  const queryClient = useQueryClient()
  const [slotEditando, setSlotEditando] = useState<{
    dia: string
    momento: MomentoMenu
    slotId: number | null
  } | null>(null)
  const [limpiarOpen, setLimpiarOpen] = useState(false)

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["comida"] })
  }

  const toggleHecho = useMutation({
    mutationFn: (slot: SlotMenuComida) =>
      alternarSlotHecho({
        data: {
          id: slot.id,
          hecho: !slot.hecho,
        },
      }),
    onSuccess: invalidar,
    onError: () => toast.error("No se pudo actualizar el plato"),
  })

  const faltantes = useMutation({
    mutationFn: () => agregarFaltantesMenu({ data: { semana } }),
    onSuccess: (resultado) => {
      invalidar()
      toast.success(
        resultado.agregados > 0
          ? `${resultado.agregados} ítem(s) agregados a la lista`
          : "No faltaba nada para comprar",
      )
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "No se pudieron agregar",
      ),
  })

  const limpiar = useMutation({
    mutationFn: () => limpiarSemanaComida({ data: { semana } }),
    onSuccess: () => {
      invalidar()
      setLimpiarOpen(false)
      toast.success("Semana limpiada")
    },
    onError: () => toast.error("No se pudo limpiar la semana"),
  })

  const slotActual = slotEditando?.slotId
    ? (menu.find((slot) => slot.id === slotEditando.slotId) ?? null)
    : null

  const nutricionPorDia = useMemo(
    () =>
      new Map(
        dias.map((dia) => [
          dia,
          sumarNutricion(
            menu
              .filter((slot) => slot.dia === dia)
              .map((slot) => slot.nutricion),
          ),
        ]),
      ),
    [dias, menu],
  )

  const nutricionSemanal = useMemo(
    () => sumarNutricion(menu.map((slot) => slot.nutricion)),
    [menu],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-outline-variant/60 bg-card p-4 shadow-elevation-1">
        <div>
          <h2 className="text-sm font-black text-heading">
            {tituloSemana(semana, hoy)}
          </h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {rangoSemana(semana)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Semana anterior"
            onClick={() => onCambiarSemana(sumarFecha(semana, "dia", -7))}
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-full px-3 text-[10px] font-bold"
            onClick={() => onCambiarSemana(semanaDeHoy(hoy))}
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Semana siguiente"
            onClick={() => onCambiarSemana(sumarFecha(semana, "dia", 7))}
          >
            <ChevronRight className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-full px-3 text-[10px] font-bold"
            disabled={faltantes.isPending}
            onClick={() => faltantes.mutate()}
          >
            <ShoppingBasket className="size-3.5" aria-hidden="true" />
            Agregar faltantes
          </Button>
          {menu.length > 0 ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-error"
              aria-label="Limpiar semana"
              onClick={() => setLimpiarOpen(true)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-outline-variant/60 bg-card shadow-elevation-1">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[5.5rem_repeat(4,minmax(0,1fr))] border-b border-outline-variant/40 bg-surface-container-low">
            <span className="px-3 py-2 text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Día
            </span>
            {MOMENTOS.map((momento) => (
              <span
                key={momento.valor}
                className="px-3 py-2 text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground"
              >
                {momento.corto}
              </span>
            ))}
          </div>

          {dias.map((dia) => (
            <div
              key={dia}
              className={cn(
                "grid grid-cols-[5.5rem_repeat(4,minmax(0,1fr))] border-b border-outline-variant/30 last:border-b-0",
                esHoy(dia, hoy) && "bg-linen-mist/40 dark:bg-primary-container/20",
              )}
            >
              <div className="px-3 py-3">
                <p className="text-[10px] font-black text-heading">
                  {etiquetaDiaCorto(dia)}
                </p>
                {esHoy(dia, hoy) ? (
                  <span className="mt-1 inline-block rounded-full bg-lime-voltage px-1.5 py-0.5 text-[7px] font-black text-forest-ink">
                    HOY
                  </span>
                ) : null}
                <p className="mt-1 text-[8px] font-semibold text-muted-foreground">
                  {Math.round(nutricionPorDia.get(dia)?.kcal ?? 0)} kcal
                </p>
              </div>

              {MOMENTOS.map((momento) => {
                const slots = menu.filter(
                  (item) =>
                    item.dia === dia && item.momento === momento.valor,
                )

                return (
                  <div
                    key={momento.valor}
                    className="m-1 flex min-h-20 flex-col gap-1"
                  >
                    {slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex flex-col rounded-2xl border border-outline-variant/50 bg-surface-container-low/50 p-2"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSlotEditando({
                              dia,
                              momento: momento.valor,
                              slotId: slot.id,
                            })
                          }
                          className="text-left"
                        >
                          <p
                            className={cn(
                              "line-clamp-2 text-[10px] font-bold leading-tight text-heading",
                              slot.hecho && "line-through opacity-60",
                            )}
                          >
                            {slot.titulo}
                          </p>
                          <p className="mt-0.5 text-[8px] text-muted-foreground">
                            {[
                              slot.minutos ? `${slot.minutos} min` : null,
                              slot.nutricion
                                ? `${Math.round(slot.nutricion.kcal)} kcal`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Sin datos"}
                          </p>
                        </button>

                        <div className="mt-1 flex items-center justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "size-6",
                              slot.hecho
                                ? "text-success"
                                : "text-muted-foreground hover:text-success",
                            )}
                            aria-label={
                              slot.hecho
                                ? `Marcar ${slot.titulo} pendiente`
                                : `Marcar ${slot.titulo} hecho`
                            }
                            onClick={() => toggleHecho.mutate(slot)}
                          >
                            <Check className="size-3" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setSlotEditando({
                          dia,
                          momento: momento.valor,
                          slotId: null,
                        })
                      }
                      className={cn(
                        "flex items-center justify-center rounded-2xl border border-dashed border-outline-variant/60 text-muted-foreground transition-colors hover:border-lime-voltage hover:bg-linen-mist/40 hover:text-heading dark:hover:bg-primary-container/20",
                        slots.length === 0 ? "min-h-20 flex-1" : "h-7",
                      )}
                      aria-label={`Agregar ${momento.corto} del ${dia}`}
                    >
                      <Plus className="size-3.5" />
                      {slots.length > 0 ? (
                        <span className="ml-1 text-[8px] font-bold">
                          Agregar otro
                        </span>
                      ) : null}
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-outline-variant/60 bg-card shadow-elevation-1">
        <div className="flex flex-wrap items-baseline justify-between gap-1 border-b border-outline-variant/40 bg-surface-container-low px-4 py-3">
          <h3 className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Valor nutricional
          </h3>
          <p className="text-[9px] text-muted-foreground">
            Suma de los platos con datos cargados
          </p>
        </div>
        <table className="w-full min-w-[640px] border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-outline-variant/40">
              <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Nutriente
              </th>
              {dias.map((dia) => (
                <th
                  key={dia}
                  className={cn(
                    "px-2 py-2 text-right text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground",
                    esHoy(dia, hoy) && "text-heading",
                  )}
                >
                  {etiquetaDiaCorto(dia)}
                </th>
              ))}
              <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-[0.08em] text-heading">
                Semana
              </th>
            </tr>
          </thead>
          <tbody>
            {CAMPOS_NUTRICION.map((campo) => (
              <tr
                key={campo.key}
                className="border-b border-outline-variant/20 last:border-b-0"
              >
                <th className="px-3 py-1.5 text-left font-semibold text-heading">
                  {campo.label}
                  <span className="ml-1 text-[9px] font-normal text-muted-foreground">
                    {campo.unidad}
                  </span>
                </th>
                {dias.map((dia) => {
                  const total = nutricionPorDia.get(dia)?.[campo.key] ?? 0
                  return (
                    <td
                      key={dia}
                      className={cn(
                        "px-2 py-1.5 text-right tabular-nums",
                        total > 0 ? "text-heading" : "text-muted-foreground/60",
                        esHoy(dia, hoy) && "bg-linen-mist/40 dark:bg-primary-container/20",
                      )}
                    >
                      {Math.round(total)}
                    </td>
                  )
                })}
                <td className="px-3 py-1.5 text-right font-bold tabular-nums text-heading">
                  {Math.round(nutricionSemanal[campo.key])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
        <ListChecks className="size-3.5" aria-hidden="true" />
        Tocá una celda para asignar una receta o un plato libre.
      </p>

      {slotEditando ? (
        <DialogoSlotMenu
          open
          onOpenChange={(open) => {
            if (!open) setSlotEditando(null)
          }}
          dia={slotEditando.dia}
          momento={slotEditando.momento}
          recetas={recetas}
          slot={slotActual}
        />
      ) : null}

      <AlertDialog open={limpiarOpen} onOpenChange={setLimpiarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Limpiar esta semana?</AlertDialogTitle>
            <AlertDialogDescription>
              Se van a borrar todos los platos planificados de la semana. Las
              recetas y la lista de compras no se tocan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-error text-paper hover:bg-error/90"
              onClick={() => limpiar.mutate()}
            >
              Limpiar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function semanaDeHoy(hoy: string) {
  const [anio, mes, dia] = hoy.split("-").map(Number)
  const fecha = new Date(Date.UTC(anio, mes - 1, dia))
  const diaSemana = fecha.getUTCDay()
  const retroceso = diaSemana === 0 ? 6 : diaSemana - 1
  return new Date(Date.UTC(anio, mes - 1, dia - retroceso))
    .toISOString()
    .slice(0, 10)
}
