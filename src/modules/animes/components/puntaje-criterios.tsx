"use client";

import { Slider } from "@base-ui/react/slider";
import { Star } from "lucide-react";
import {
  CRITERIOS_ANIME,
  PUNTAJE_MAXIMO_CRITERIO,
  PUNTAJE_MAXIMO_TOTAL,
  calcularTotalPuntajes,
  contarCriteriosCalificados,
  type CriterioAnimeKey,
  type PuntajesCriterios,
} from "@/modules/animes/lib/criterios";

export function PuntajeCriterios({
  puntajes,
  onChange,
  puntajePrevio,
}: {
  puntajes: PuntajesCriterios;
  onChange: (criterio: CriterioAnimeKey, valor: number) => void;
  puntajePrevio?: number | null;
}) {
  const total = calcularTotalPuntajes(puntajes);
  const calificados = contarCriteriosCalificados(puntajes);
  const totalMostrado = total ?? puntajePrevio ?? null;
  const esPuntajePrevio = total === null && puntajePrevio != null;
  const faltan = CRITERIOS_ANIME.length - calificados;

  return (
    <div className="space-y-3 rounded-xl border border-outline-variant/50 bg-surface-container-low p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-outline-variant/40 bg-card px-3 py-2.5 shadow-elevation-1">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-warning-container text-on-warning-container">
            <Star size={16} fill="currentColor" />
          </span>
          <div>
            <p className="text-sm font-semibold text-charcoal">Puntaje total</p>
            <p className="text-[11px] text-on-surface-variant">
              {esPuntajePrevio
                ? "Puntaje anterior sin desglose"
                : total === null
                  ? "Sin puntuar: mové un slider para calificar"
                  : faltan > 0
                    ? `Faltan ${faltan} criterio${faltan === 1 ? "" : "s"} por calificar`
                    : "Los 10 criterios están calificados"}
            </p>
          </div>
        </div>
        <p className="flex items-baseline gap-1 tabular-nums">
          <span className="text-2xl font-bold text-charcoal">
            {totalMostrado ?? "—"}
          </span>
          <span className="text-xs font-medium text-pebble">
            / {PUNTAJE_MAXIMO_TOTAL}
          </span>
        </p>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
        <div
          className="h-full rounded-full bg-warning transition-all"
          style={{
            width: `${((totalMostrado ?? 0) / PUNTAJE_MAXIMO_TOTAL) * 100}%`,
          }}
        />
      </div>

      <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
        {CRITERIOS_ANIME.map((criterio) => {
          const valor = puntajes[criterio.key];
          const sinCalificar = valor === null;

          return (
            <div key={criterio.key} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={`text-xs font-medium ${
                    sinCalificar ? "text-on-surface-variant" : "text-charcoal"
                  }`}
                  title={criterio.descripcion}
                >
                  {criterio.etiqueta}
                </span>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                    sinCalificar
                      ? "bg-surface-container-high text-pebble"
                      : "bg-inverse-surface text-inverse-on-surface"
                  }`}
                >
                  {sinCalificar ? "—" : valor}
                  <span className="font-normal opacity-60">
                    /{PUNTAJE_MAXIMO_CRITERIO}
                  </span>
                </span>
              </div>

              <p className="line-clamp-1 text-[10px] leading-tight text-pebble">
                {criterio.descripcion}
              </p>

              <Slider.Root
                value={valor ?? 0}
                onValueChange={(nuevo) => onChange(criterio.key, nuevo)}
                min={0}
                max={PUNTAJE_MAXIMO_CRITERIO}
                step={1}
              >
                <Slider.Control className="flex w-full touch-none items-center py-1.5 select-none">
                  <Slider.Track className="h-1.5 w-full rounded-full bg-surface-container-high select-none">
                    <Slider.Indicator className="rounded-full bg-warning select-none" />
                    <Slider.Thumb
                      aria-label={`${criterio.etiqueta}: ${
                        valor ?? 0
                      } de ${PUNTAJE_MAXIMO_CRITERIO}`}
                      className={`size-3.5 rounded-full border-2 border-surface-container-lowest shadow-elevation-1 select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                        sinCalificar ? "bg-outline-variant" : "bg-warning"
                      }`}
                    />
                  </Slider.Track>
                </Slider.Control>
              </Slider.Root>
            </div>
          );
        })}
      </div>
    </div>
  );
}
