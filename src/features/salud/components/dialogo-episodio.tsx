"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  Clock,
  Loader2,
  Pill,
  Sparkles,
} from "lucide-react"
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
  ALIVIOS,
  AURA_TIPOS,
  CATEGORIAS_FACTORES,
  FACTORES,
  LATERALIDADES,
  MAX_COMPRIMIDOS_TETRALGIN,
  PATRONES,
  SINTOMAS,
  nivelDolor,
} from "@/features/salud/constantes"
import {
  fechaHoraAhora,
  formatearDuracion,
  minutosEntre,
  partirEnFechaHora,
  sumarDias,
  unirFechaHora,
} from "@/features/salud/lib/fechas"
import type {
  ActualizarEpisodioInput,
  CrearEpisodioInput,
} from "@/features/salud/schemas"
import {
  actualizarEpisodio,
  crearEpisodio,
} from "@/features/salud/server/functions"
import type { EpisodioConFactores } from "@/features/salud/types"
import { cn } from "cn"

type Valores = {
  inicioFecha: string
  inicioHora: string
  finFecha: string
  finHora: string
  intensidad: number
  patron: string
  lateralidad: string
  aura: boolean
  auraTipos: string[]
  sintomas: string[]
  factores: string[]
  otro: string
  tomoTetralgin: boolean
  dosis: number
  tetralginFecha: string
  tetralginHora: string
  alivio: string
  notas: string
}

const CAMPO =
  "h-10 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-sm text-heading outline-none focus:border-ring"

function valoresDesde(
  episodio: EpisodioConFactores | null | undefined,
  ahora: string,
): Valores {
  if (episodio) {
    const inicio = partirEnFechaHora(episodio.inicioEn)
    const fin = episodio.finEn ? partirEnFechaHora(episodio.finEn) : null
    const tetralgin = episodio.tetralginEn
      ? partirEnFechaHora(episodio.tetralginEn)
      : null

    return {
      inicioFecha: inicio.fecha,
      inicioHora: inicio.hora,
      finFecha: fin?.fecha ?? "",
      finHora: fin?.hora ?? "",
      intensidad: episodio.intensidad,
      patron: episodio.patron ?? "",
      lateralidad: episodio.lateralidad ?? "",
      aura: episodio.aura,
      auraTipos: episodio.auraTipos,
      sintomas: episodio.sintomas,
      factores: episodio.factores,
      otro: episodio.otroDesencadenante ?? "",
      tomoTetralgin: episodio.tomoTetralgin,
      dosis: episodio.dosisTetralgin ?? 1,
      tetralginFecha: tetralgin?.fecha ?? inicio.fecha,
      tetralginHora: tetralgin?.hora ?? "",
      alivio: episodio.alivio ?? "",
      notas: episodio.notas ?? "",
    }
  }

  const inicio = partirEnFechaHora(ahora)
  return {
    inicioFecha: inicio.fecha,
    inicioHora: inicio.hora,
    finFecha: "",
    finHora: "",
    intensidad: 5,
    patron: "",
    lateralidad: "",
    aura: false,
    auraTipos: [],
    sintomas: [],
    factores: [],
    otro: "",
    tomoTetralgin: false,
    dosis: 1,
    tetralginFecha: inicio.fecha,
    tetralginHora: "",
    alivio: "",
    notas: "",
  }
}

export function DialogoEpisodio({
  open,
  onOpenChange,
  episodio,
  ahora,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  episodio?: EpisodioConFactores | null
  ahora: string
}) {
  const queryClient = useQueryClient()
  const [valores, setValores] = useState<Valores>(() =>
    valoresDesde(episodio, ahora),
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setValores(valoresDesde(episodio, ahora))
    setError(null)
  }, [open, episodio?.id, ahora])

  const crear = useMutation({
    mutationFn: (datos: CrearEpisodioInput) => crearEpisodio({ data: datos }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["salud"] })
      toast.success("Episodio registrado")
      onOpenChange(false)
    },
    onError: (err) =>
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el episodio",
      ),
  })

  const editar = useMutation({
    mutationFn: (datos: ActualizarEpisodioInput) =>
      actualizarEpisodio({ data: datos }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["salud"] })
      toast.success("Episodio actualizado")
      onOpenChange(false)
    },
    onError: (err) =>
      setError(
        err instanceof Error ? err.message : "No se pudo actualizar el episodio",
      ),
  })

  const guardando = crear.isPending || editar.isPending

  const inicioEn = unirFechaHora(valores.inicioFecha, valores.inicioHora)
  const finEn = unirFechaHora(valores.finFecha, valores.finHora)
  const duracion =
    inicioEn && finEn ? minutosEntre(inicioEn, finEn) : null
  const nivel = nivelDolor(valores.intensidad)

  const factoresPorCategoria = useMemo(
    () =>
      CATEGORIAS_FACTORES.map((categoria) => ({
        ...categoria,
        factores: FACTORES.filter(
          (factor) => factor.categoria === categoria.id,
        ),
      })).filter((categoria) => categoria.factores.length > 0),
    [],
  )

  function actualizar<TCampo extends keyof Valores>(
    campo: TCampo,
    valor: Valores[TCampo],
  ) {
    setValores((anterior) => ({ ...anterior, [campo]: valor }))
  }

  function cambiarInicioFecha(fecha: string) {
    setValores((anterior) => ({
      ...anterior,
      inicioFecha: fecha,
      tetralginFecha:
        anterior.tetralginFecha === anterior.inicioFecha
          ? fecha
          : anterior.tetralginFecha,
      finFecha: anterior.finHora
        ? anterior.finHora <= anterior.inicioHora
          ? sumarDias(fecha, 1)
          : fecha
        : "",
    }))
  }

  function cambiarFinHora(hora: string) {
    setValores((anterior) => {
      if (!hora) return { ...anterior, finHora: "", finFecha: "" }
      return {
        ...anterior,
        finHora: hora,
        finFecha:
          anterior.inicioHora && hora <= anterior.inicioHora
            ? sumarDias(anterior.inicioFecha, 1)
            : anterior.inicioFecha,
      }
    })
  }

  function cerrarAhora() {
    const actual = fechaHoraAhora()
    const { fecha, hora } = partirEnFechaHora(actual)
    setValores((anterior) => ({ ...anterior, finFecha: fecha, finHora: hora }))
  }

  function alternarLista(
    clave: "auraTipos" | "sintomas" | "factores",
    valor: string,
  ) {
    setValores((anterior) => {
      const lista = anterior[clave]
      const activo = lista.includes(valor)
      let siguiente = activo
        ? lista.filter((item) => item !== valor)
        : [...lista, valor]

      if (clave === "factores") {
        if (!activo && valor === "sin-trigger") siguiente = ["sin-trigger"]
        if (!activo && valor !== "sin-trigger") {
          siguiente = siguiente.filter((item) => item !== "sin-trigger")
        }
        if (activo && valor === "otro") {
          return { ...anterior, factores: siguiente, otro: "" }
        }
      }

      return { ...anterior, [clave]: siguiente }
    })
  }

  function guardar() {
    setError(null)

    if (!inicioEn) {
      setError("Completá la fecha y la hora de inicio")
      return
    }

    if (finEn && duracion !== null && duracion <= 0) {
      setError("La hora de cierre tiene que ser posterior al inicio")
      return
    }

    if (valores.factores.includes("otro") && !valores.otro.trim()) {
      setError("Contanos cuál fue el desencadenante")
      return
    }

    if (
      valores.tomoTetralgin &&
      finEn &&
      !valores.alivio
    ) {
      setError("Indicá cómo respondió el Tetralgin")
      return
    }

    const datos: CrearEpisodioInput = {
      inicioEn,
      finEn: finEn ?? null,
      intensidad: valores.intensidad,
      patron: valores.patron
        ? (valores.patron as CrearEpisodioInput["patron"])
        : null,
      lateralidad: valores.lateralidad
        ? (valores.lateralidad as CrearEpisodioInput["lateralidad"])
        : null,
      aura: valores.aura,
      auraTipos: valores.aura ? valores.auraTipos : [],
      sintomas: valores.sintomas,
      tomoTetralgin: valores.tomoTetralgin,
      dosisTetralgin: valores.tomoTetralgin ? valores.dosis : null,
      tetralginEn:
        valores.tomoTetralgin && valores.tetralginHora
          ? unirFechaHora(valores.tetralginFecha, valores.tetralginHora)
          : null,
      alivio: valores.tomoTetralgin && valores.alivio
        ? (valores.alivio as CrearEpisodioInput["alivio"])
        : null,
      otroDesencadenante: valores.otro.trim() || null,
      notas: valores.notas.trim() || null,
      factores: valores.factores,
    }

    if (episodio) {
      editar.mutate({ id: episodio.id, ...datos })
    } else {
      crear.mutate(datos)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            {episodio ? "Editar episodio" : "Registrar episodio"}
          </DialogTitle>
          <DialogDescription>
            Cargá intensidad, duración, desencadenantes y medicación.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault()
            guardar()
          }}
        >
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Intensidad del dolor
              </h3>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-bold",
                  nivel.clase,
                )}
              >
                {valores.intensidad}/10 · {nivel.label}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={valores.intensidad}
              onChange={(event) =>
                actualizar("intensidad", Number(event.target.value))
              }
              className="h-2 w-full cursor-pointer accent-lime-voltage"
              aria-label="Intensidad del dolor"
            />
            <div className="flex justify-between text-[9px] font-semibold text-muted-foreground">
              <span>Leve</span>
              <span>Moderada</span>
              <span>Severa</span>
              <span>Muy severa</span>
            </div>
          </section>

          <section className="space-y-3 border-t border-outline-variant/40 pt-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Fecha y duración
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid grid-cols-[1.2fr_0.8fr] gap-2">
                <div className="space-y-2">
                  <Label htmlFor="episodio-inicio-fecha">Inicio</Label>
                  <Input
                    id="episodio-inicio-fecha"
                    type="date"
                    value={valores.inicioFecha}
                    onChange={(event) => cambiarInicioFecha(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="episodio-inicio-hora">Hora</Label>
                  <Input
                    id="episodio-inicio-hora"
                    type="time"
                    value={valores.inicioHora}
                    onChange={(event) =>
                      actualizar("inicioHora", event.target.value)
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-[1.2fr_0.8fr] gap-2">
                <div className="space-y-2">
                  <Label htmlFor="episodio-fin-fecha">Fin</Label>
                  <Input
                    id="episodio-fin-fecha"
                    type="date"
                    value={valores.finFecha}
                    onChange={(event) =>
                      actualizar("finFecha", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="episodio-fin-hora">Hora</Label>
                  <Input
                    id="episodio-fin-hora"
                    type="time"
                    value={valores.finHora}
                    onChange={(event) => cambiarFinHora(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full px-3 text-[10px] font-bold"
                onClick={cerrarAhora}
              >
                <Clock className="size-3.5" aria-hidden="true" />
                Cerrar ahora
              </Button>
              {!valores.finHora ? (
                <span className="text-[10px] font-semibold text-muted-foreground">
                  Queda en curso
                </span>
              ) : duracion !== null && duracion > 0 ? (
                <span className="text-[10px] font-semibold text-muted-foreground">
                  Duración: {formatearDuracion(duracion)}
                </span>
              ) : null}
            </div>
          </section>

          <section className="grid gap-3 border-t border-outline-variant/40 pt-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="episodio-patron">Patrón del dolor</Label>
              <select
                id="episodio-patron"
                value={valores.patron}
                onChange={(event) =>
                  actualizar("patron", event.target.value)
                }
                className={CAMPO}
              >
                <option value="">Sin especificar</option>
                {PATRONES.map((patron) => (
                  <option key={patron.valor} value={patron.valor}>
                    {patron.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="episodio-lateralidad">Lateralidad</Label>
              <select
                id="episodio-lateralidad"
                value={valores.lateralidad}
                onChange={(event) =>
                  actualizar("lateralidad", event.target.value)
                }
                className={CAMPO}
              >
                <option value="">Sin especificar</option>
                {LATERALIDADES.map((lado) => (
                  <option key={lado.valor} value={lado.valor}>
                    {lado.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="space-y-3 border-t border-outline-variant/40 pt-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                <Sparkles className="size-3" aria-hidden="true" />
                Aura
              </h3>
              <button
                type="button"
                onClick={() => actualizar("aura", !valores.aura)}
                className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-bold transition-colors",
                  valores.aura
                    ? "bg-forest-ink text-paper dark:bg-lime-voltage dark:text-forest-ink"
                    : "bg-surface-container text-muted-foreground",
                )}
              >
                {valores.aura ? "Con aura" : "Sin aura"}
              </button>
            </div>
            {valores.aura ? (
              <div className="flex flex-wrap gap-1.5">
                {AURA_TIPOS.map((aura) => (
                  <Chip
                    key={aura.valor}
                    activo={valores.auraTipos.includes(aura.valor)}
                    onClick={() => alternarLista("auraTipos", aura.valor)}
                  >
                    {aura.label}
                  </Chip>
                ))}
              </div>
            ) : null}
          </section>

          <section className="space-y-3 border-t border-outline-variant/40 pt-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Síntomas
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {SINTOMAS.map((sintoma) => (
                <Chip
                  key={sintoma.valor}
                  activo={valores.sintomas.includes(sintoma.valor)}
                  onClick={() => alternarLista("sintomas", sintoma.valor)}
                >
                  {sintoma.label}
                </Chip>
              ))}
            </div>
          </section>

          <section className="space-y-3 border-t border-outline-variant/40 pt-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Desencadenantes
            </h3>
            <div className="space-y-3">
              {factoresPorCategoria.map((categoria) => (
                <div key={categoria.id}>
                  <p className="mb-1.5 text-[9px] font-bold text-muted-foreground">
                    {categoria.label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {categoria.factores.map((factor) => (
                      <Chip
                        key={factor.slug}
                        activo={valores.factores.includes(factor.slug)}
                        onClick={() => alternarLista("factores", factor.slug)}
                      >
                        {factor.label}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {valores.factores.includes("otro") ? (
              <div className="space-y-2">
                <Label htmlFor="episodio-otro">¿Cuál?</Label>
                <Input
                  id="episodio-otro"
                  value={valores.otro}
                  onChange={(event) => actualizar("otro", event.target.value)}
                  placeholder="Describí el desencadenante"
                />
              </div>
            ) : null}
          </section>

          <section className="space-y-3 border-t border-outline-variant/40 pt-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                <Pill className="size-3" aria-hidden="true" />
                Tetralgin
              </h3>
              <button
                type="button"
                onClick={() =>
                  actualizar("tomoTetralgin", !valores.tomoTetralgin)
                }
                className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-bold transition-colors",
                  valores.tomoTetralgin
                    ? "bg-forest-ink text-paper dark:bg-lime-voltage dark:text-forest-ink"
                    : "bg-surface-container text-muted-foreground",
                )}
              >
                {valores.tomoTetralgin ? "Tomó" : "No tomó"}
              </button>
            </div>

            {valores.tomoTetralgin ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="episodio-dosis">Comprimidos</Label>
                  <Input
                    id="episodio-dosis"
                    type="number"
                    min={1}
                    max={MAX_COMPRIMIDOS_TETRALGIN}
                    value={valores.dosis}
                    onChange={(event) =>
                      actualizar("dosis", Number(event.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="episodio-tetralgin-fecha">Fecha</Label>
                  <Input
                    id="episodio-tetralgin-fecha"
                    type="date"
                    value={valores.tetralginFecha}
                    onChange={(event) =>
                      actualizar("tetralginFecha", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="episodio-tetralgin-hora">Hora</Label>
                  <Input
                    id="episodio-tetralgin-hora"
                    type="time"
                    value={valores.tetralginHora}
                    onChange={(event) =>
                      actualizar("tetralginHora", event.target.value)
                    }
                  />
                </div>
              </div>
            ) : null}

            {valores.tomoTetralgin ? (
              <div className="space-y-2">
                <Label htmlFor="episodio-alivio">Respuesta</Label>
                <select
                  id="episodio-alivio"
                  value={valores.alivio}
                  onChange={(event) =>
                    actualizar("alivio", event.target.value)
                  }
                  className={CAMPO}
                >
                  <option value="">Sin respuesta registrada</option>
                  {ALIVIOS.map((alivio) => (
                    <option key={alivio.valor} value={alivio.valor}>
                      {alivio.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </section>

          <section className="space-y-2 border-t border-outline-variant/40 pt-4">
            <Label htmlFor="episodio-notas">Notas</Label>
            <Textarea
              id="episodio-notas"
              value={valores.notas}
              onChange={(event) => actualizar("notas", event.target.value)}
              rows={3}
              placeholder="Contexto, medicación, cómo te sentiste..."
            />
          </section>

          {error ? (
            <p className="rounded-xl bg-error-container px-3 py-2 text-[10px] font-semibold text-error">
              {error}
            </p>
          ) : null}

          <DialogFooter showCloseButton={false}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="size-4" aria-hidden="true" />
                  {episodio ? "Guardar cambios" : "Registrar episodio"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Chip({
  children,
  activo,
  onClick,
}: {
  children: ReactNode
  activo: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[9px] font-semibold transition-colors",
        activo
          ? "border-forest-ink bg-forest-ink text-paper dark:border-lime-voltage dark:bg-lime-voltage dark:text-forest-ink"
          : "border-outline-variant/60 bg-card text-muted-foreground hover:text-heading",
      )}
    >
      {children}
    </button>
  )
}
