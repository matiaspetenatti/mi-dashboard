"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Droplets,
  Gauge,
  MapPin,
  Plus,
  Sun,
  Sunrise,
  Sunset,
  Trash2,
  Wind,
  X,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
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
import { PageHeader } from "@/components/organisms/page-header"
import { Button } from "@/components/ui/button"
import { DialogoUbicacion } from "@/features/clima/components/dialogo-ubicacion"
import { HorasClimaChart } from "@/features/clima/components/horas-chart"
import { IconoDelClima } from "@/features/clima/components/icono-clima"
import { Pronostico14Chart } from "@/features/clima/components/pronostico-14-chart"
import {
  eliminarUbicacion,
  seleccionarUbicacion,
} from "@/features/clima/server/functions"
import type {
  UbicacionClima,
  WorkspaceClima,
} from "@/features/clima/types"
import { fechaHoy } from "@/lib/dates"
import { cn } from "cn"

export function WorkspaceClima({
  workspace,
}: {
  workspace: WorkspaceClima
}) {
  const queryClient = useQueryClient()
  const [ubicacionOpen, setUbicacionOpen] = useState(false)
  const [ubicacionAEliminar, setUbicacionAEliminar] =
    useState<UbicacionClima | null>(null)
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)

  const dias = workspace.needsLocation ? [] : workspace.dias
  const horas = workspace.needsLocation ? [] : workspace.horas
  const activa = workspace.needsLocation ? null : workspace.activa
  const actual = workspace.needsLocation ? null : workspace.actual

  const diaActivo =
    dias.find((dia) => dia.fecha === diaSeleccionado) ?? dias.at(0) ?? null
  const horasDia = diaActivo
    ? horas.filter((hora) => hora.hora.startsWith(diaActivo.fecha))
    : []

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["clima"] })
  }

  const seleccionar = useMutation({
    mutationFn: (id: number) => seleccionarUbicacion({ data: { id } }),
    onSuccess: () => {
      invalidar()
      setDiaSeleccionado(null)
    },
    onError: () => toast.error("No se pudo seleccionar la ubicación"),
  })

  const borrar = useMutation({
    mutationFn: (id: number) => eliminarUbicacion({ data: { id } }),
    onSuccess: () => {
      invalidar()
      toast.success("Ubicación eliminada")
      setUbicacionAEliminar(null)
      setDiaSeleccionado(null)
    },
    onError: () => toast.error("No se pudo eliminar la ubicación"),
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Pronóstico"
        title="Clima"
        description="El clima actual y los próximos 14 días en tus lugares guardados."
        meta={activa?.etiqueta ?? "Sin ubicación"}
        actions={
          <Button onClick={() => setUbicacionOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Agregar ubicación
          </Button>
        }
      />

      {workspace.ubicaciones.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {workspace.ubicaciones.map((ubicacion) => {
            const activaActual = ubicacion.id === activa?.id
            return (
              <div
                key={ubicacion.id}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-1 py-0.5",
                  activaActual
                    ? "border-forest-ink bg-forest-ink text-paper dark:border-lime-voltage dark:bg-lime-voltage dark:text-forest-ink"
                    : "border-outline-variant/70 bg-card text-muted-foreground",
                )}
              >
                <button
                  type="button"
                  onClick={() => seleccionar.mutate(ubicacion.id)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold"
                >
                  <MapPin className="size-3" aria-hidden="true" />
                  {ubicacion.etiqueta}
                </button>
                <button
                  type="button"
                  aria-label={`Eliminar ${ubicacion.etiqueta}`}
                  onClick={() => setUbicacionAEliminar(ubicacion)}
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full opacity-60 hover:opacity-100",
                    activaActual
                      ? "hover:bg-white/15"
                      : "hover:bg-muted hover:text-heading",
                  )}
                >
                  <X className="size-3" />
                </button>
              </div>
            )
          })}
          <Button
            variant="outline"
            size="sm"
            className="h-7 rounded-full px-3 text-[10px] font-bold"
            onClick={() => setUbicacionOpen(true)}
          >
            <Plus className="size-3" aria-hidden="true" />
            Agregar
          </Button>
        </div>
      ) : null}

      {workspace.needsLocation || !activa || !actual || !diaActivo ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-outline-variant/70 bg-card/50 px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-linen-mist text-forest-ink dark:bg-primary-container dark:text-lime-voltage">
            <MapPin className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-black text-heading">
              Elegí una ubicación para ver el clima
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Buscá una ciudad y guardala para tener el pronóstico a mano.
            </p>
          </div>
          <Button onClick={() => setUbicacionOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Agregar ubicación
          </Button>
        </div>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
            <div className="relative overflow-hidden rounded-3xl border border-outline-variant/60 bg-card p-6 shadow-elevation-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    <MapPin className="size-3" aria-hidden="true" />
                    {activa.etiqueta}
                  </p>
                  <p className="tabular mt-4 text-6xl font-black leading-none text-heading">
                    {actual.temperatura}°
                  </p>
                  <p className="mt-2 text-sm font-semibold text-on-surface-variant">
                    {actual.descripcion}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Sensación {actual.sensacion}° · Máx {diaActivo.max}° / Mín{" "}
                    {diaActivo.min}°
                  </p>
                </div>
                <span className="flex size-16 items-center justify-center rounded-full bg-linen-mist text-forest-ink dark:bg-primary-container dark:text-lime-voltage">
                  <IconoDelClima
                    icono={actual.icono}
                    className="size-8"
                  />
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Sunrise className="size-3.5 text-secondary" aria-hidden="true" />
                  {diaActivo.amanecer
                    ? format(parseISO(diaActivo.amanecer), "HH:mm")
                    : "—"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Sunset className="size-3.5 text-secondary" aria-hidden="true" />
                  {diaActivo.atardecer
                    ? format(parseISO(diaActivo.atardecer), "HH:mm")
                    : "—"}
                </span>
                <span className="ml-auto rounded-full bg-surface-container px-2 py-1 text-[9px] font-bold">
                  Actualizado ahora
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-3xl border border-outline-variant/60 bg-card p-4 shadow-elevation-1 sm:grid-cols-3">
              <Metrica icon={Droplets} label="Humedad" value={`${actual.humedad}%`} />
              <Metrica icon={Wind} label="Viento" value={`${actual.viento} km/h`} />
              <Metrica
                icon={Droplets}
                label="Lluvia"
                value={`${diaActivo.probLluvia}%`}
              />
              <Metrica
                icon={Gauge}
                label="Presión"
                value={`${actual.presion} hPa`}
              />
              <Metrica icon={Sun} label="UV" value={String(diaActivo.uv)} />
              <Metrica
                icon={MapPin}
                label="Actual"
                value={`${actual.lluvia} mm`}
              />
            </div>
          </section>

          <Pronostico14Chart dias={dias} />

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-black text-heading">
              Próximos 14 días
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-7">
              {dias.map((dia) => {
                const activoDia = dia.fecha === diaActivo.fecha
                const hoy = dia.fecha === fechaHoy()
                return (
                  <button
                    key={dia.fecha}
                    type="button"
                    onClick={() => setDiaSeleccionado(dia.fecha)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-colors",
                      activoDia
                        ? "border-lime-voltage bg-linen-mist/70 dark:bg-primary-container/50"
                        : "border-outline-variant/50 bg-card hover:bg-muted/60",
                    )}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                      {hoy
                        ? "Hoy"
                        : format(parseISO(dia.fecha), "EEE", { locale: es })}
                    </span>
                    <span className="text-[10px] font-semibold text-heading">
                      {format(parseISO(dia.fecha), "d MMM", { locale: es })}
                    </span>
                    <IconoDelClima
                      icono={dia.icono}
                      className="my-1 size-5 text-secondary"
                    />
                    <span className="tabular text-[11px] font-black text-heading">
                      {dia.max}° / {dia.min}°
                    </span>
                    <span className="text-[9px] font-semibold text-signal-blue">
                      {dia.probLluvia}% lluvia
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {horasDia.length > 0 ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-black text-heading">
                  Detalle por hora ·{" "}
                  <span className="capitalize">
                    {format(parseISO(diaActivo.fecha), "EEEE d MMMM", {
                      locale: es,
                    })}
                  </span>
                </h2>
              </div>

              <HorasClimaChart horas={horasDia} />

              <div className="flex gap-2 overflow-x-auto pb-1">
                {horasDia.map((hora) => (
                    <div
                      key={hora.hora}
                      className="flex w-20 shrink-0 flex-col items-center gap-1 rounded-2xl border border-outline-variant/50 bg-card p-2 text-center"
                    >
                      <span className="tabular text-[9px] font-bold text-muted-foreground">
                        {format(parseISO(hora.hora), "HH:mm")}
                      </span>
                      <IconoDelClima
                        icono={hora.icono}
                        className="size-4 text-secondary"
                      />
                      <span className="tabular text-[11px] font-black text-heading">
                        {hora.temperatura}°
                      </span>
                      <span className="text-[8px] font-semibold text-signal-blue">
                        {hora.probLluvia}%
                      </span>
                      <span className="text-[8px] text-muted-foreground">
                        {hora.viento} km/h
                      </span>
                    </div>
                  ))}
              </div>
            </>
          ) : null}
        </>
      )}

      <DialogoUbicacion
        open={ubicacionOpen}
        onOpenChange={setUbicacionOpen}
      />

      <AlertDialog
        open={Boolean(ubicacionAEliminar)}
        onOpenChange={(open) => {
          if (!open) setUbicacionAEliminar(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta ubicación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se va a quitar “{ubicacionAEliminar?.etiqueta}” de tus lugares
              guardados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-error text-paper hover:bg-error/90"
              onClick={() => {
                if (ubicacionAEliminar) borrar.mutate(ubicacionAEliminar.id)
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Metrica({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Droplets
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-3">
      <Icon className="size-4 text-secondary" aria-hidden="true" />
      <p className="tabular mt-2 text-sm font-black text-heading">{value}</p>
      <p className="text-[9px] font-semibold text-muted-foreground">{label}</p>
    </div>
  )
}
