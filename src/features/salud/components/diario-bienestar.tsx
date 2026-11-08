"use client"

import { useMemo, useState, type ReactNode } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Activity,
  Droplets,
  Moon,
  Monitor,
  NotebookPen,
  Save,
  Smile,
  Trash2,
  Utensils,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  eliminarRegistroDiario,
  guardarRegistroDiario,
} from "@/features/salud/server/functions"
import { formatearDiaLargo } from "@/features/salud/lib/fechas"
import { formatearFecha } from "@/lib/format"
import type { RegistroDiarioSalud } from "@/server/db/schema"
import { cn } from "cn"

type Valores = {
  horasSueno: string
  calidadSueno: string
  vasosAgua: string
  nivelEstres: string
  horasPantalla: string
  tazasCafeina: string
  comidasOmitidas: string
  actividadMin: string
  animo: string
  pesoKg: string
  notas: string
}

const VACIO: Valores = {
  horasSueno: "",
  calidadSueno: "",
  vasosAgua: "",
  nivelEstres: "",
  horasPantalla: "",
  tazasCafeina: "",
  comidasOmitidas: "",
  actividadMin: "",
  animo: "",
  pesoKg: "",
  notas: "",
}

function desdeRegistro(registro: RegistroDiarioSalud | undefined): Valores {
  if (!registro) return { ...VACIO }
  const texto = (valor: number | null) => (valor === null ? "" : String(valor))
  return {
    horasSueno: texto(registro.horasSueno),
    calidadSueno: texto(registro.calidadSueno),
    vasosAgua: texto(registro.vasosAgua),
    nivelEstres: texto(registro.nivelEstres),
    horasPantalla: texto(registro.horasPantalla),
    tazasCafeina: texto(registro.tazasCafeina),
    comidasOmitidas: texto(registro.comidasOmitidas),
    actividadMin: texto(registro.actividadMin),
    animo: texto(registro.animo),
    pesoKg: texto(registro.pesoKg),
    notas: registro.notas ?? "",
  }
}

function numeroONull(valor: string): number | null {
  const texto = valor.trim().replace(",", ".")
  if (!texto) return null
  const numero = Number(texto)
  return Number.isFinite(numero) ? numero : null
}

export function DiarioBienestar({
  registros,
  hoy,
}: {
  registros: RegistroDiarioSalud[]
  hoy: string
}) {
  const queryClient = useQueryClient()
  const porFecha = useMemo(
    () => new Map(registros.map((registro) => [registro.fecha, registro])),
    [registros],
  )
  const [fecha, setFecha] = useState(hoy)
  const [valores, setValores] = useState<Valores>(() =>
    desdeRegistro(porFecha.get(hoy)),
  )

  const registroActual = porFecha.get(fecha)
  const diaLargo = formatearDiaLargo(fecha)
  const diaTexto = diaLargo.charAt(0).toUpperCase() + diaLargo.slice(1)

  const guardar = useMutation({
    mutationFn: () =>
      guardarRegistroDiario({
        data: {
          fecha,
          horasSueno: numeroONull(valores.horasSueno),
          calidadSueno: numeroONull(valores.calidadSueno),
          vasosAgua: numeroONull(valores.vasosAgua),
          nivelEstres: numeroONull(valores.nivelEstres),
          horasPantalla: numeroONull(valores.horasPantalla),
          tazasCafeina: numeroONull(valores.tazasCafeina),
          comidasOmitidas: numeroONull(valores.comidasOmitidas),
          actividadMin: numeroONull(valores.actividadMin),
          animo: numeroONull(valores.animo),
          pesoKg: numeroONull(valores.pesoKg),
          notas: valores.notas.trim() || null,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["salud"] })
      toast.success("Diario guardado")
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el registro",
      ),
  })

  const eliminar = useMutation({
    mutationFn: (id: number) => eliminarRegistroDiario({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["salud"] })
      toast.success("Registro eliminado")
      setValores({ ...VACIO })
    },
    onError: () => toast.error("No se pudo eliminar el registro"),
  })

  function cambiarFecha(nueva: string) {
    if (!nueva) return
    setFecha(nueva)
    setValores(desdeRegistro(porFecha.get(nueva)))
  }

  function actualizar(campo: keyof Valores, valor: string) {
    setValores((anterior) => ({ ...anterior, [campo]: valor }))
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <section className="rounded-3xl border border-outline-variant/60 bg-card p-5 shadow-elevation-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-black tracking-tight text-heading">
              <NotebookPen className="size-4 text-secondary" aria-hidden="true" />
              Diario de bienestar
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Un registro por día para comparar hábitos con las crisis.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="diario-fecha" className="text-[9px]">
              Día
            </Label>
            <Input
              id="diario-fecha"
              type="date"
              value={fecha}
              max={hoy}
              onChange={(event) => cambiarFecha(event.target.value)}
              className="h-9 w-40 text-xs"
            />
          </div>
        </div>

        <p className="mt-2 text-[11px] font-medium text-muted-foreground">
          {diaTexto}
          {registroActual ? (
            <span className="ml-2 rounded-full bg-success-container px-2 py-0.5 text-[9px] font-bold text-success">
              Registro cargado
            </span>
          ) : null}
        </p>

        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            guardar.mutate()
          }}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Campo etiqueta="Horas de sueño">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                max={24}
                step={0.5}
                placeholder="8"
                value={valores.horasSueno}
                onChange={(event) =>
                  actualizar("horasSueno", event.target.value)
                }
                className="h-9"
              />
            </Campo>
            <Campo etiqueta="Calidad de sueño (1-5)">
              <Input
                type="number"
                min={1}
                max={5}
                placeholder="4"
                value={valores.calidadSueno}
                onChange={(event) =>
                  actualizar("calidadSueno", event.target.value)
                }
                className="h-9"
              />
            </Campo>
            <Campo etiqueta="Vasos de agua">
              <Input
                type="number"
                min={0}
                max={30}
                placeholder="8"
                value={valores.vasosAgua}
                onChange={(event) =>
                  actualizar("vasosAgua", event.target.value)
                }
                className="h-9"
              />
            </Campo>
            <Campo etiqueta="Estrés (1-5)">
              <Input
                type="number"
                min={1}
                max={5}
                placeholder="2"
                value={valores.nivelEstres}
                onChange={(event) =>
                  actualizar("nivelEstres", event.target.value)
                }
                className="h-9"
              />
            </Campo>
            <Campo etiqueta="Horas de pantalla">
              <Input
                type="number"
                min={0}
                max={24}
                step={0.5}
                placeholder="6"
                value={valores.horasPantalla}
                onChange={(event) =>
                  actualizar("horasPantalla", event.target.value)
                }
                className="h-9"
              />
            </Campo>
            <Campo etiqueta="Tazas de café">
              <Input
                type="number"
                min={0}
                max={20}
                placeholder="2"
                value={valores.tazasCafeina}
                onChange={(event) =>
                  actualizar("tazasCafeina", event.target.value)
                }
                className="h-9"
              />
            </Campo>
            <Campo etiqueta="Comidas omitidas">
              <Input
                type="number"
                min={0}
                max={10}
                placeholder="0"
                value={valores.comidasOmitidas}
                onChange={(event) =>
                  actualizar("comidasOmitidas", event.target.value)
                }
                className="h-9"
              />
            </Campo>
            <Campo etiqueta="Actividad (min)">
              <Input
                type="number"
                min={0}
                max={1440}
                placeholder="30"
                value={valores.actividadMin}
                onChange={(event) =>
                  actualizar("actividadMin", event.target.value)
                }
                className="h-9"
              />
            </Campo>
            <Campo etiqueta="Ánimo (1-5)">
              <Input
                type="number"
                min={1}
                max={5}
                placeholder="4"
                value={valores.animo}
                onChange={(event) => actualizar("animo", event.target.value)}
                className="h-9"
              />
            </Campo>
            <Campo etiqueta="Peso (kg)">
              <Input
                type="number"
                min={20}
                max={400}
                step={0.1}
                placeholder="75"
                value={valores.pesoKg}
                onChange={(event) => actualizar("pesoKg", event.target.value)}
                className="h-9"
              />
            </Campo>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diario-notas">Notas</Label>
            <Textarea
              id="diario-notas"
              value={valores.notas}
              onChange={(event) => actualizar("notas", event.target.value)}
              rows={2}
              placeholder="Cómo dormiste, qué comiste, cómo te sentiste..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={guardar.isPending}>
              <Save className="size-4" aria-hidden="true" />
              {guardar.isPending ? "Guardando..." : "Guardar día"}
            </Button>
            {registroActual ? (
              <Button
                type="button"
                variant="outline"
                className="border-error/30 text-error hover:bg-error-container hover:text-error"
                disabled={eliminar.isPending}
                onClick={() => eliminar.mutate(registroActual.id)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Eliminar registro
              </Button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-outline-variant/60 bg-card p-5 shadow-elevation-1">
        <h2 className="text-sm font-black tracking-tight text-heading">
          Últimos registros
        </h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Tocá un día para cargarlo en el formulario.
        </p>

        {registros.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-surface-container-low px-4 py-10 text-center">
            <p className="text-xs font-bold text-heading">
              Todavía no hay registros
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Guardá el día de hoy para empezar.
            </p>
          </div>
        ) : (
          <ul className="mt-3 max-h-[560px] space-y-2 overflow-y-auto pr-1">
            {registros.map((registro) => (
              <li key={registro.id}>
                <button
                  type="button"
                  onClick={() => cambiarFecha(registro.fecha)}
                  className={cn(
                    "w-full rounded-2xl border p-3 text-left transition-colors",
                    registro.fecha === fecha
                      ? "border-lime-voltage bg-linen-mist/60 dark:bg-primary-container/40"
                      : "border-outline-variant/50 bg-surface-container-low/50 hover:bg-muted/60",
                  )}
                >
                  <p className="text-[11px] font-black text-heading">
                    {formatearFecha(registro.fecha, false)}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Dato
                      icon={Moon}
                      valor={
                        registro.horasSueno !== null
                          ? `${registro.horasSueno} h`
                          : "—"
                      }
                    />
                    <Dato
                      icon={Droplets}
                      valor={
                        registro.vasosAgua !== null
                          ? `${registro.vasosAgua}`
                          : "—"
                      }
                    />
                    <Dato
                      icon={Activity}
                      valor={
                        registro.nivelEstres !== null
                          ? `${registro.nivelEstres}/5`
                          : "—"
                      }
                    />
                    <Dato
                      icon={Monitor}
                      valor={
                        registro.horasPantalla !== null
                          ? `${registro.horasPantalla} h`
                          : "—"
                      }
                    />
                    <Dato
                      icon={Smile}
                      valor={
                        registro.animo !== null ? `${registro.animo}/5` : "—"
                      }
                    />
                    <Dato
                      icon={Utensils}
                      valor={
                        registro.tazasCafeina !== null
                          ? `${registro.tazasCafeina}`
                          : "—"
                      }
                    />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Campo({
  etiqueta,
  children,
}: {
  etiqueta: string
  children: ReactNode
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {etiqueta}
      </span>
      {children}
    </label>
  )
}

function Dato({
  icon: Icon,
  valor,
}: {
  icon: typeof Moon
  valor: string
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-card px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
      <Icon className="size-2.5" aria-hidden="true" />
      {valor}
    </span>
  )
}
