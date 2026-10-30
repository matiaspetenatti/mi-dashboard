"use client";

import { useId, useState } from "react";
import { ChevronDown, Star } from "lucide-react";
import type { AnimeVisto } from "@/modules/animes/schema";
import {
  CRITERIOS_ANIME,
  PUNTAJE_MAXIMO_CRITERIO,
  PUNTAJE_MAXIMO_TOTAL,
  calcularTotalPuntajes,
  contarCriteriosCalificados,
  extraerPuntajes,
  puntajeMostrable,
} from "@/modules/animes/lib/criterios";

export function DesglosePuntaje({ anime }: { anime: AnimeVisto }) {
  const [abierto, setAbierto] = useState(false);
  const contenidoId = useId();

  const puntajes = extraerPuntajes(anime);
  const totalCalculado = calcularTotalPuntajes(puntajes);
  const calificados = contarCriteriosCalificados(puntajes);
  const total = puntajeMostrable(anime);
  const esLegacy = totalCalculado === null && total !== null;

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-low">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-controls={contenidoId}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-container"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning-container text-on-warning-container">
          <Star size={16} fill="currentColor" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-charcoal">
            Mi puntaje
          </span>
          <span className="block text-[11px] text-on-surface-variant">
            {total === null
              ? "Sin puntaje asignado"
              : esLegacy
                ? "Puntaje anterior sin desglose"
                : `${calificados} de ${CRITERIOS_ANIME.length} criterios calificados`}
          </span>
        </span>
        <span className="flex items-baseline gap-1 tabular-nums">
          <span className="text-lg font-semibold text-charcoal">
            {total ?? "—"}
          </span>
          <span className="text-xs font-medium text-pebble">
            / {PUNTAJE_MAXIMO_TOTAL}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-pebble transition-transform ${
            abierto ? "rotate-180" : ""
          }`}
        />
      </button>

      {abierto && (
        <div id={contenidoId} className="border-t border-outline-variant/40 px-4 pb-4 pt-3">
          {total === null ? (
            <p className="text-xs text-on-surface-variant">
              Todavía no calificaste este anime. Usá “Editar” para cargar el
              desglose por criterios.
            </p>
          ) : esLegacy ? (
            <p className="text-xs text-on-surface-variant">
              Tiene un puntaje total de {total}/100, pero se cargó antes de que
              existiera el desglose. Editá el anime para calificar los 10
              criterios.
            </p>
          ) : (
            <>
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className="h-full rounded-full bg-warning transition-all"
                  style={{
                    width: `${((total ?? 0) / PUNTAJE_MAXIMO_TOTAL) * 100}%`,
                  }}
                />
              </div>

              <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
                {CRITERIOS_ANIME.map((criterio) => {
                  const valor = puntajes[criterio.key];
                  const sinCalificar = valor === null;

                  return (
                    <div key={criterio.key} className="space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={`text-xs font-medium ${
                            sinCalificar
                              ? "text-on-surface-variant"
                              : "text-charcoal"
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

                      <div className="h-1 overflow-hidden rounded-full bg-surface-container-high">
                        <div
                          className={`h-full rounded-full transition-all ${
                            sinCalificar ? "bg-outline-variant" : "bg-warning"
                          }`}
                          style={{
                            width: sinCalificar
                              ? "0%"
                              : `${(valor / PUNTAJE_MAXIMO_CRITERIO) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
