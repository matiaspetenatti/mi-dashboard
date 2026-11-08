"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Minus,
  Pencil,
  Plus,
  Star,
  Trash2,
  Tv,
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
import {
  clasesEstadoAnime,
  etiquetasEstadoAnime,
} from "@/features/animes/constantes"
import {
  CRITERIOS_ANIME,
  PUNTAJE_MAXIMO_TOTAL,
  calcularTotalPuntajes,
  extraerPuntajes,
  puntajeMostrable,
} from "@/features/animes/lib/criterios"
import { obtenerTemporadaAnime } from "@/features/animes/lib/utils"
import {
  actualizarProgresoAnime,
  alternarFavoritoAnime,
} from "@/features/animes/server/functions"
import type { AnimeVisto } from "@/server/db/schema"
import { cn } from "cn"

export function PanelAnime({
  anime,
  open,
  onOpenChange,
  onEditar,
  onEliminar,
}: {
  anime: AnimeVisto
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditar: () => void
  onEliminar: () => void
}) {
  const queryClient = useQueryClient()
  const [vistos, setVistos] = useState(anime.episodiosVistos)

  useEffect(() => {
    setVistos(anime.episodiosVistos)
  }, [anime.id, anime.episodiosVistos])

  const progreso = useMutation({
    mutationFn: (episodiosVistos: number) =>
      actualizarProgresoAnime({
        data: { id: anime.id, episodiosVistos },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["animes"] })
    },
    onError: () => {
      setVistos(anime.episodiosVistos)
      toast.error("No se pudo actualizar el progreso")
    },
  })

  const favorito = useMutation({
    mutationFn: () => alternarFavoritoAnime({ data: { id: anime.id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["animes"] })
    },
    onError: () => toast.error("No se pudo actualizar favoritos"),
  })

  const total = anime.episodios ?? null
  const titulo = anime.tituloIngles || anime.titulo
  const puntaje = puntajeMostrable(anime)
  const criterios = extraerPuntajes(anime)
  const calificados = CRITERIOS_ANIME.filter(
    (criterio) => criterios[criterio.key] !== null,
  )
  const totalCriterios = calcularTotalPuntajes(criterios)
  const avance =
    total && total > 0 ? Math.min(100, Math.round((vistos / total) * 100)) : 0
  const temporada = obtenerTemporadaAnime(anime.fechaEmision)

  function guardarProgreso(siguiente: number) {
    const limite = total && total > 0 ? total : siguiente
    const nuevo = Math.max(0, Math.min(Math.trunc(siguiente), limite))
    if (nuevo === vistos) return
    setVistos(nuevo)
    progreso.mutate(nuevo)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black tracking-tight">
            {titulo}
          </DialogTitle>
          <DialogDescription>
            {[anime.tipo, anime.ano, temporada?.label].filter(Boolean).join(" · ") ||
              "Detalle del anime"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-4">
          {anime.imagen ? (
            <img
              src={anime.imagen}
              alt={titulo}
              referrerPolicy="no-referrer"
              className="h-44 w-32 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-44 w-32 shrink-0 items-center justify-center rounded-2xl bg-surface-container text-muted-foreground">
              <Tv className="size-8" aria-hidden="true" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            {anime.tituloIngles ? (
              <p className="text-[11px] font-semibold text-muted-foreground">
                {anime.titulo}
              </p>
            ) : null}

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[9px] font-bold",
                  clasesEstadoAnime[anime.estado],
                )}
              >
                {etiquetasEstadoAnime[anime.estado]}
              </span>
              {anime.favorito ? (
                <span className="flex items-center gap-1 rounded-full bg-lime-voltage px-2 py-1 text-[9px] font-bold text-forest-ink">
                  <Star className="size-2.5 fill-current" aria-hidden="true" />
                  Favorito
                </span>
              ) : null}
              {anime.scoreMal !== null ? (
                <span className="rounded-full bg-surface-container px-2.5 py-1 text-[9px] font-bold text-muted-foreground">
                  MAL {anime.scoreMal.toFixed(2)}
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex items-end gap-2">
              <span className="tabular text-5xl font-black leading-none text-heading">
                {puntaje ?? "—"}
              </span>
              {puntaje !== null ? (
                <span className="pb-1 text-[10px] font-semibold text-muted-foreground">
                  / {PUNTAJE_MAXIMO_TOTAL}
                </span>
              ) : (
                <span className="pb-1 text-[10px] font-semibold text-muted-foreground">
                  Sin puntaje
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant={anime.favorito ? "default" : "outline"}
                size="sm"
                className="h-8 rounded-full px-3 text-[10px] font-bold"
                disabled={favorito.isPending}
                onClick={() => favorito.mutate()}
              >
                <Star
                  className={cn("size-3.5", anime.favorito && "fill-current")}
                  aria-hidden="true"
                />
                {anime.favorito ? "Favorito" : "Marcar favorito"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full px-3 text-[10px] font-bold"
                onClick={onEditar}
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Editar
              </Button>
            </div>
          </div>
        </div>

        {anime.descripcion ? (
          <p className="rounded-2xl bg-surface-container-low p-4 text-[11px] leading-relaxed text-muted-foreground">
            {anime.descripcion}
          </p>
        ) : null}

        <section className="rounded-2xl border border-outline-variant/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Progreso
            </h3>
            <span className="tabular text-[10px] font-bold text-heading">
              {vistos}/{total ?? "?"} episodios
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full bg-lime-voltage transition-[width]"
              style={{ width: `${Math.max(avance > 0 ? 3 : 0, avance)}%` }}
            />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              aria-label="Restar un episodio"
              disabled={vistos <= 0 || progreso.isPending}
              onClick={() => guardarProgreso(vistos - 1)}
            >
              <Minus className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              aria-label="Sumar un episodio"
              disabled={
                progreso.isPending ||
                (total !== null && total > 0 && vistos >= total)
              }
              onClick={() => guardarProgreso(vistos + 1)}
            >
              <Plus className="size-3.5" />
            </Button>

            {total && total > 0 && vistos < total ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto h-8 rounded-full px-3 text-[10px] font-bold"
                disabled={progreso.isPending}
                onClick={() => guardarProgreso(total)}
              >
                Marcar completado
              </Button>
            ) : null}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Dato etiqueta="Estudio" valor={anime.estudio ?? "—"} />
          <Dato etiqueta="Fuente" valor={anime.fuente ?? "—"} />
          <Dato etiqueta="Formato" valor={anime.formato ?? "—"} />
          <Dato
            etiqueta="Emisión"
            valor={anime.fechaEmision ?? "—"}
          />
          <Dato
            etiqueta="Temporada"
            valor={temporada?.label ?? "—"}
          />
          <Dato
            etiqueta="Kitsu / AniList"
            valor={`${anime.kitsuId}${anime.anilistId ? ` / ${anime.anilistId}` : ""}`}
          />
        </section>

        <section className="rounded-2xl border border-outline-variant/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Desglose de puntaje
            </h3>
            {totalCriterios !== null ? (
              <span className="tabular text-[10px] font-bold text-heading">
                {totalCriterios}/{PUNTAJE_MAXIMO_TOTAL} ·{" "}
                {calificados.length}/10 criterios
              </span>
            ) : null}
          </div>

          {calificados.length === 0 ? (
            <p className="mt-3 rounded-xl bg-surface-container-low px-3 py-4 text-center text-[10px] text-muted-foreground">
              Todavía no cargaste criterios. Usá “Editar” para puntuar el anime.
            </p>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {calificados.map((criterio) => (
                <div
                  key={criterio.key}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-3 py-2"
                >
                  <span
                    className="text-[10px] font-semibold text-muted-foreground"
                    title={criterio.descripcion}
                  >
                    {criterio.etiqueta}
                  </span>
                  <span className="tabular text-[11px] font-black text-heading">
                    {criterios[criterio.key]}/10
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {(anime.tags ?? []).length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {(anime.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface-container px-2.5 py-1 text-[9px] font-semibold text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        {anime.notas ? (
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Notas
            </h3>
            <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">
              {anime.notas}
            </p>
          </section>
        ) : null}

        <DialogFooter showCloseButton={false}>
          <Button
            type="button"
            variant="outline"
            className="border-error/30 text-error hover:bg-error-container hover:text-error"
            onClick={onEliminar}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Eliminar
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-xl bg-surface-container-low px-3 py-2">
      <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {etiqueta}
      </p>
      <p className="mt-1 truncate text-[10px] font-bold text-heading">{valor}</p>
    </div>
  )
}
