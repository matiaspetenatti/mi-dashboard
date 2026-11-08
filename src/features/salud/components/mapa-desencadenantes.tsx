"use client"

import { Trophy } from "lucide-react"

import {
  CATEGORIAS_POR_ID,
  type CategoriaFactor,
} from "@/features/salud/constantes"
import type { FilaMapa } from "@/features/salud/types"

export function MapaDesencadenantes({ mapa }: { mapa: FilaMapa[] }) {
  return (
    <section className="flex h-full flex-col rounded-3xl border border-outline-variant/60 bg-card p-5 shadow-elevation-1">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-black tracking-tight text-heading">
            Desencadenantes
          </h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Frecuencia en los últimos 90 días
          </p>
        </div>
        <Trophy className="size-4 text-secondary" aria-hidden="true" />
      </div>

      {mapa.length === 0 ? (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl bg-surface-container-low px-4 py-8 text-center">
          <p className="text-xs font-bold text-heading">
            Sin desencadenantes registrados
          </p>
          <p className="text-[10px] text-muted-foreground">
            Cargalos al registrar un episodio.
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-1 flex-col gap-3">
          {mapa.map((fila) => {
            const categoria =
              CATEGORIAS_POR_ID.get(fila.categoria as CategoriaFactor)?.label ??
              fila.categoria
            return (
              <li key={fila.factor}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="min-w-0 truncate text-[11px] font-bold text-heading">
                    {fila.etiqueta}
                  </p>
                  <span className="tabular shrink-0 text-[10px] font-bold text-muted-foreground">
                    {fila.episodios} · {fila.porcentaje}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-container">
                  <div
                    className="h-full rounded-full bg-lime-voltage"
                    style={{
                      width: `${Math.min(100, Math.max(3, fila.porcentaje))}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-[9px] text-muted-foreground">
                  {categoria}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
