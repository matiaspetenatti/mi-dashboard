"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CalendarDays,
  Check,
  Clock,
  Loader2,
  RefreshCw,
  Tv,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { calendarioAnimesQuery } from "@/features/animes/api"
import { actualizarProgresoAnime, getCalendarioAnimes } from "@/features/animes/server/functions"
import type { AnimeCalendarioItem } from "@/features/animes/types"
import { fechaHoy } from "@/lib/dates"
import { formatearFecha } from "@/lib/format"
import type { AnimeVisto } from "@/server/db/schema"
import { cn } from "cn"

export function CalendarioAnimes({ animes }: { animes: AnimeVisto[] }) {
  const queryClient = useQueryClient()
  const { data, isPending, isError, refetch } = useQuery(calendarioAnimesQuery)
  const [marcandoId, setMarcandoId] = useState<string | null>(null)

  const actualizar = useMutation({
    mutationFn: () => getCalendarioAnimes({ data: { forzar: true } }),
    onSuccess: (nuevo) => {
      queryClient.setQueryData(calendarioAnimesQuery.queryKey, nuevo)
      toast.success("Calendario actualizado")
    },
    onError: () => toast.error("No se pudo actualizar el calendario"),
  })

  const marcar = useMutation({
    mutationFn: (item: AnimeCalendarioItem) =>
      actualizarProgresoAnime({
        data: {
          id: item.animeVistoId,
          episodiosVistos: item.episodio ?? 1,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["animes"] })
      toast.success("Episodio marcado como visto")
    },
    onError: () => toast.error("No se pudo actualizar el progreso"),
    onSettled: () => setMarcandoId(null),
  })

  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-3xl border border-outline-variant/60 bg-card py-16 text-xs font-semibold text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Buscando horarios de emisión...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-outline-variant/70 bg-card/50 px-6 py-14 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-error-container text-error">
          <CalendarDays className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-black text-heading">
            No se pudo cargar el calendario
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            AniList no respondió. Probá de nuevo en unos segundos.
          </p>
        </div>
        <Button variant="outline" onClick={() => void refetch()}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Reintentar
        </Button>
      </div>
    )
  }

  const progresoPorAnime = new Map(
    animes.map((anime) => [anime.id, anime.episodiosVistos]),
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-outline-variant/60 bg-card p-4 shadow-elevation-1">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black text-heading">
            <CalendarDays className="size-4 text-secondary" aria-hidden="true" />
            Emisiones de la semana
          </h2>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {formatearFecha(data.semana.inicio, false)} al{" "}
            {formatearFecha(data.semana.fin, false)} · AniList
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-full px-4 text-[10px] font-bold"
          disabled={actualizar.isPending}
          onClick={() => actualizar.mutate()}
        >
          <RefreshCw
            className={cn("size-3.5", actualizar.isPending && "animate-spin")}
            aria-hidden="true"
          />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-2 overflow-x-auto pb-1 md:grid-cols-7">
        {data.dias.map((dia) => {
          const esHoy = dia.fecha === fechaHoy()
          return (
            <section
              key={dia.indice}
              className={cn(
                "flex min-w-40 flex-col rounded-3xl border p-3",
                esHoy
                  ? "border-lime-voltage bg-linen-mist/50 dark:bg-primary-container/30"
                  : "border-outline-variant/60 bg-card",
              )}
            >
              <header className="mb-2 flex items-center justify-between gap-1">
                <div>
                  <p className="text-[10px] font-black text-heading">
                    {dia.nombre}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {formatearFecha(dia.fecha, false)}
                  </p>
                </div>
                <span className="rounded-full bg-surface-container px-1.5 py-0.5 text-[8px] font-bold text-muted-foreground">
                  {dia.items.length}
                </span>
              </header>

              {dia.items.length === 0 ? (
                <p className="my-4 text-center text-[9px] text-muted-foreground">
                  Sin estrenos
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {dia.items.map((item) => {
                    const vistos = progresoPorAnime.get(item.animeVistoId) ?? 0
                    const visto =
                      item.episodio !== null && item.episodio <= vistos
                    const marcando = marcar.isPending && marcandoId === item.id

                    return (
                      <li
                        key={item.id}
                        className="rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 p-2"
                      >
                        <div className="flex items-start gap-2">
                          {item.imagen ? (
                            <img
                              src={item.imagen}
                              alt=""
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              className="h-14 w-10 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <span className="flex h-14 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container text-muted-foreground">
                              <Tv className="size-3.5" aria-hidden="true" />
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-[9px] font-bold leading-tight text-heading">
                              {item.titulo}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-[8px] font-semibold text-muted-foreground">
                              <Clock className="size-2.5" aria-hidden="true" />
                              {item.hora}
                              {item.episodio !== null
                                ? ` · Ep. ${item.episodio}`
                                : ""}
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant={visto ? "ghost" : "outline"}
                          size="sm"
                          className={cn(
                            "mt-2 h-6 w-full rounded-full px-2 text-[8px] font-bold",
                            visto && "text-success",
                          )}
                          disabled={visto || marcando || item.episodio === null}
                          onClick={() => {
                            setMarcandoId(item.id)
                            marcar.mutate(item)
                          }}
                        >
                          {marcando ? (
                            <Loader2
                              className="size-2.5 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <Check className="size-2.5" aria-hidden="true" />
                          )}
                          {visto ? "Visto" : "Marcar visto"}
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      {data.sinHorario.length > 0 ? (
        <section className="rounded-3xl border border-outline-variant/60 bg-card p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Sin horario esta semana
          </h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {data.sinHorario.map((anime) => (
              <li
                key={anime.animeVistoId}
                className="rounded-full bg-surface-container px-3 py-1.5 text-[10px] font-semibold text-muted-foreground"
              >
                {anime.titulo}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-right text-[9px] text-muted-foreground">
        Actualizado{" "}
        {new Date(data.actualizadoEn).toLocaleString("es-AR", {
          dateStyle: "short",
          timeStyle: "short",
        })}
      </p>
    </div>
  )
}
