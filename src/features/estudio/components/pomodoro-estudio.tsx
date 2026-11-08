"use client"

import { useEffect, useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pause, Play, RotateCcw, Timer } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { registrarSesion } from "@/features/estudio/server/functions"
import { fechaHoy } from "@/lib/dates"
import type { Materia } from "@/server/db/schema"
import { cn } from "cn"

const TRABAJO = 25 * 60
const DESCANSO = 5 * 60

export function PomodoroEstudio({
  carreraId,
  materias,
}: {
  carreraId: number
  materias: Materia[]
}) {
  const queryClient = useQueryClient()
  const [materiaId, setMateriaId] = useState<number | null>(
    materias.at(0)?.id ?? null,
  )
  const [segundos, setSegundos] = useState(TRABAJO)
  const [corriendo, setCorriendo] = useState(false)
  const [modo, setModo] = useState<"trabajo" | "descanso">("trabajo")

  useEffect(() => {
    if (materiaId && materias.some((materia) => materia.id === materiaId)) {
      return
    }
    setMateriaId(materias.at(0)?.id ?? null)
  }, [materias, materiaId])

  const registrar = useMutation({
    mutationFn: () => {
      if (!materiaId) throw new Error("Elegí una materia")
      return registrarSesion({
        data: {
          carreraId,
          materiaId,
          tipo: "trabajo",
          duracionMinutos: 25,
          fecha: fechaHoy(),
        },
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["estudio"] })
      toast.success("Sesión de 25 minutos registrada")
    },
    onError: () => toast.error("No se pudo registrar la sesión"),
  })

  const registrarRef = useRef(registrar.mutate)
  useEffect(() => {
    registrarRef.current = registrar.mutate
  }, [registrar.mutate])

  useEffect(() => {
    if (!corriendo) return
    const intervalo = window.setInterval(() => {
      setSegundos((valor) => Math.max(0, valor - 1))
    }, 1000)
    return () => window.clearInterval(intervalo)
  }, [corriendo])

  useEffect(() => {
    if (segundos > 0) return
    setCorriendo(false)

    if (modo === "trabajo") {
      registrarRef.current()
      setModo("descanso")
      setSegundos(DESCANSO)
    } else {
      setModo("trabajo")
      setSegundos(TRABAJO)
      toast.info("Descanso terminado. A seguir.")
    }
  }, [segundos, modo])

  const minutos = Math.floor(segundos / 60)
  const resto = segundos % 60
  const progreso =
    modo === "trabajo"
      ? 1 - segundos / TRABAJO
      : 1 - segundos / DESCANSO

  return (
    <section className="rounded-3xl border border-outline-variant/60 bg-card p-6 shadow-elevation-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-heading">Pomodoro</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {modo === "trabajo" ? "25 min de foco" : "5 min de descanso"}
          </p>
        </div>
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            modo === "trabajo"
              ? "bg-linen-mist text-forest-ink dark:bg-primary-container dark:text-lime-voltage"
              : "bg-signal-blue/10 text-signal-blue",
          )}
        >
          <Timer className="size-5" aria-hidden="true" />
        </span>
      </div>

      <p className="tabular mt-5 text-center text-5xl font-black leading-none text-heading">
        {String(minutos).padStart(2, "0")}:{String(resto).padStart(2, "0")}
      </p>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-container">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-1000",
            modo === "trabajo" ? "bg-lime-voltage" : "bg-signal-blue",
          )}
          style={{ width: `${Math.min(100, Math.max(0, progreso * 100))}%` }}
        />
      </div>

      <div className="mt-4 space-y-2">
        <select
          value={materiaId ?? ""}
          onChange={(event) => setMateriaId(Number(event.target.value))}
          className="h-9 w-full rounded-xl border border-outline-variant/70 bg-card px-3 text-xs text-heading outline-none focus:border-ring"
          disabled={materias.length === 0}
        >
          {materias.length === 0 ? (
            <option value="">Sin materias</option>
          ) : null}
          {materias.map((materia) => (
            <option key={materia.id} value={materia.id}>
              {materia.nombre}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            className="flex-1"
            onClick={() => setCorriendo((valor) => !valor)}
            disabled={!materiaId}
          >
            {corriendo ? (
              <Pause className="size-4" aria-hidden="true" />
            ) : (
              <Play className="size-4" aria-hidden="true" />
            )}
            {corriendo ? "Pausar" : "Iniciar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Reiniciar Pomodoro"
            onClick={() => {
              setCorriendo(false)
              setModo("trabajo")
              setSegundos(TRABAJO)
            }}
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
