"use client"

import { GitCompareArrows } from "lucide-react"

import type { CorrelacionHabitos } from "@/features/salud/types"

export function CorrelacionHabitosCard({
  correlacion,
}: {
  correlacion: CorrelacionHabitos | null
}) {
  return (
    <section className="rounded-3xl border border-outline-variant/60 bg-card p-5 shadow-elevation-1">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-black tracking-tight text-heading">
            Hábitos y crisis
          </h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Promedios en días con y sin migraña · últimos 90 días
          </p>
        </div>
        <GitCompareArrows className="size-4 text-secondary" aria-hidden="true" />
      </div>

      {!correlacion || correlacion.metricas.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-surface-container-low px-4 py-6 text-center">
          <p className="text-xs font-bold text-heading">
            Todavía no hay suficientes datos
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Necesitás al menos 7 registros de bienestar y días con y sin crisis
            para comparar hábitos.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-semibold text-muted-foreground">
            <span className="rounded-full bg-surface-container px-2.5 py-1">
              {correlacion.registros} registros
            </span>
            <span className="rounded-full bg-error-container px-2.5 py-1 text-error">
              {correlacion.registrosConCrisis} con crisis
            </span>
            <span className="rounded-full bg-success-container px-2.5 py-1 text-success">
              {correlacion.registrosSinCrisis} sin crisis
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-outline-variant/40">
            <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr] gap-2 bg-surface-container-low px-3 py-2 text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              <span>Hábito</span>
              <span className="text-right">Con crisis</span>
              <span className="text-right">Sin crisis</span>
            </div>
            <ul className="divide-y divide-outline-variant/30">
              {correlacion.metricas.map((metrica) => (
                <li
                  key={metrica.clave}
                  className="grid grid-cols-[1.4fr_0.8fr_0.8fr] items-center gap-2 px-3 py-2"
                >
                  <span className="truncate text-[10px] font-semibold text-muted-foreground">
                    {metrica.etiqueta}
                  </span>
                  <span className="tabular text-right text-[11px] font-black text-heading">
                    {metrica.conCrisis}
                    <span className="ml-0.5 text-[8px] font-semibold text-muted-foreground">
                      {metrica.unidad}
                    </span>
                  </span>
                  <span className="tabular text-right text-[11px] font-black text-heading">
                    {metrica.sinCrisis}
                    <span className="ml-0.5 text-[8px] font-semibold text-muted-foreground">
                      {metrica.unidad}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  )
}
