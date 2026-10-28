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
    <div className="overflow-hidden rounded-xl border bg-neutral-50">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        aria-controls={contenidoId}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-100/70"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Star size={16} fill="currentColor" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-neutral-800">
            Mi puntaje
          </span>
          <span className="block text-[11px] text-neutral-500">
            {total === null
              ? "Sin puntaje asignado"
              : esLegacy
                ? "Puntaje anterior sin desglose"
                : `${calificados} de ${CRITERIOS_ANIME.length} criterios calificados`}
          </span>
        </span>
        <span className="flex items-baseline gap-1 tabular-nums">
          <span className="text-lg font-semibold text-neutral-900">
            {total ?? "—"}
          </span>
          <span className="text-xs font-medium text-neutral-400">
            / {PUNTAJE_MAXIMO_TOTAL}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-neutral-400 transition-transform ${
            abierto ? "rotate-180" : ""
          }`}
        />
      </button>

      {abierto && (
        <div id={contenidoId} className="border-t px-4 pb-4 pt-3">
          {total === null ? (
            <p className="text-xs text-neutral-500">
              Todavía no calificaste este anime. Usá “Editar” para cargar el
              desglose por criterios.
            </p>
          ) : esLegacy ? (
            <p className="text-xs text-neutral-500">
              Tiene un puntaje total de {total}/100, pero se cargó antes de que
              existiera el desglose. Editá el anime para calificar los 10
              criterios.
            </p>
          ) : (
            <>
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
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
                              ? "text-neutral-500"
                              : "text-neutral-800"
                          }`}
                          title={criterio.descripcion}
                        >
                          {criterio.etiqueta}
                        </span>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                            sinCalificar
                              ? "bg-neutral-100 text-neutral-400"
                              : "bg-neutral-900 text-white"
                          }`}
                        >
                          {sinCalificar ? "—" : valor}
                          <span className="font-normal opacity-60">
                            /{PUNTAJE_MAXIMO_CRITERIO}
                          </span>
                        </span>
                      </div>

                      <p className="line-clamp-1 text-[10px] leading-tight text-neutral-400">
                        {criterio.descripcion}
                      </p>

                      <div className="h-1 overflow-hidden rounded-full bg-neutral-200">
                        <div
                          className={`h-full rounded-full transition-all ${
                            sinCalificar ? "bg-neutral-300" : "bg-amber-400"
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
