"use client"

import { useMemo } from "react"

import { DIAS_SEMANA } from "@/features/habitos/constantes"
import {
  agruparPorSemanas,
  mapaRegistros,
} from "@/features/habitos/lib/habitos"
import type { RegistroHabitoSimple } from "@/features/habitos/types"
import { formatearFecha } from "@/lib/format"
import { cn } from "cn"

export function HeatmapHabito({
  registros,
  color,
  tipo,
  hoy,
  onToggle,
}: {
  registros: RegistroHabitoSimple[]
  color: string
  tipo: "bueno" | "malo"
  hoy: string
  onToggle: (fecha: string, completado: boolean) => void
}) {
  const mapa = useMemo(() => mapaRegistros(registros), [registros])
  const semanas = useMemo(
    () => agruparPorSemanas(registros.map((registro) => registro.fecha)),
    [registros],
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Último año
          </p>
          <p className="text-[10px] text-muted-foreground">
            {tipo === "bueno" ? "Días completados" : "Días limpios"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-sm bg-surface-container" />
            Sin registro
          </span>
          <span className="flex items-center gap-1">
            <span
              className="size-2.5 rounded-sm"
              style={{ backgroundColor: color }}
            />
            {tipo === "bueno" ? "Completado" : "Día limpio"}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1.5">
          <div className="flex flex-col gap-1 pr-1">
            {DIAS_SEMANA.map((dia) => (
              <span
                key={dia.clave}
                className="flex h-2.5 items-center justify-end text-[7px] font-semibold text-muted-foreground"
              >
                {dia.etiqueta}
              </span>
            ))}
          </div>

          {semanas.map((semana, indiceSemana) => (
            <div key={indiceSemana} className="flex flex-col gap-1">
              {semana.map((fecha, indiceDia) => {
                if (!fecha) {
                  return (
                    <span
                      key={`${indiceSemana}-${indiceDia}`}
                      className="size-2.5 rounded-sm bg-transparent"
                    />
                  )
                }

                const completado = mapa.get(fecha) === true
                const esHoy = fecha === hoy
                const estado =
                  tipo === "bueno"
                    ? completado
                      ? "Completado"
                      : "No completado"
                    : completado
                      ? "Día limpio"
                      : "Recaída"

                return (
                  <button
                    key={fecha}
                    type="button"
                    onClick={() => onToggle(fecha, !completado)}
                    title={`${formatearFecha(fecha, false)} · ${estado}`}
                    aria-label={`${formatearFecha(fecha, false)}: ${estado}`}
                    className={cn(
                      "size-2.5 rounded-sm transition-transform hover:scale-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      esHoy && "ring-1 ring-heading",
                    )}
                    style={{
                      backgroundColor: completado ? color : undefined,
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="text-[9px] text-muted-foreground">
        Tocá un día para marcarlo o desmarcarlo.
      </p>
    </div>
  )
}
