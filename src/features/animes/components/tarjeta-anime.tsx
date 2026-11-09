"use client"

import { CalendarDays, Pencil, Star, Tv } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  clasesEstadoAnime,
  etiquetasEstadoAnime,
} from "@/features/animes/constantes"
import { puntajeMostrable } from "@/features/animes/lib/criterios"
import { obtenerTemporadaAnime } from "@/features/animes/lib/utils"
import type { AnimeVisto } from "@/server/db/schema"
import { cn } from "cn"

export function TarjetaAnime({
  anime,
  onAbrir,
  onEditar,
  onAlternarFavorito,
  favoritoPendiente = false,
}: {
  anime: AnimeVisto
  onAbrir: () => void
  onEditar: () => void
  onAlternarFavorito: () => void
  favoritoPendiente?: boolean
}) {
  const titulo = anime.tituloIngles || anime.titulo
  const total = anime.episodios ?? null
  const vistos = anime.episodiosVistos
  const avance =
    total && total > 0 ? Math.min(100, Math.round((vistos / total) * 100)) : 0
  const puntaje = puntajeMostrable(anime)
  const temporada = obtenerTemporadaAnime(anime.fechaEmision)

  return (
    <div className="group relative h-full">
      <button
        type="button"
        onClick={onAbrir}
        className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-outline-variant/60 bg-card text-left shadow-elevation-1 transition-all hover:-translate-y-0.5 hover:shadow-elevation-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden bg-surface-container">
          {anime.imagen ? (
            <img
              src={anime.imagen}
              alt={titulo}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Tv className="size-10" aria-hidden="true" />
            </div>
          )}

          <div className="absolute left-2 top-2 flex flex-wrap items-center gap-1">
            {anime.tipo ? (
              <span className="rounded-full bg-black/65 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                {anime.tipo}
              </span>
            ) : null}
            {total ? (
              <span className="rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-semibold text-white/90 backdrop-blur-sm">
                {vistos > 0 ? `${vistos}/${total} eps` : `${total} eps`}
              </span>
            ) : null}
          </div>

          <div className="absolute inset-x-2 bottom-2 flex items-end justify-between gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[9px] font-bold shadow-sm",
                clasesEstadoAnime[anime.estado],
              )}
            >
              {etiquetasEstadoAnime[anime.estado]}
            </span>
            {puntaje !== null ? (
              <span className="flex items-center gap-0.5 rounded-full bg-lime-voltage px-2 py-0.5 text-[10px] font-black text-forest-ink">
                <Star className="size-2.5 fill-current" aria-hidden="true" />
                {puntaje}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <h3 className="line-clamp-2 min-h-[2.1rem] text-xs font-black leading-snug text-heading">
            {titulo}
          </h3>

          <span className="inline-flex w-fit max-w-full items-center gap-1 rounded-full bg-surface-container px-1.5 py-0.5 text-[9px] font-bold text-heading">
            <CalendarDays className="size-2.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {temporada?.label ?? "Sin temporada"}
            </span>
          </span>

          <p className="truncate text-[9px] text-muted-foreground">
            {[anime.ano, anime.estudio].filter(Boolean).join(" · ") ||
              "Sin año"}
            {anime.scoreMal !== null
              ? ` · MAL ${anime.scoreMal.toFixed(2)}`
              : ""}
          </p>

          <div className="mt-auto pt-1">
            {total ? (
              <>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
                  <div
                    className="h-full rounded-full bg-lime-voltage"
                    style={{
                      width: `${Math.max(avance > 0 ? 3 : 0, avance)}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-right text-[9px] font-bold text-muted-foreground">
                  {vistos}/{total} · {avance}%
                </p>
              </>
            ) : (
              <p className="text-right text-[9px] font-bold text-muted-foreground">
                {vistos > 0 ? `${vistos} episodios vistos` : "Sin progreso"}
              </p>
            )}
          </div>
        </div>
      </button>

      <div className="absolute right-2 top-2 flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "size-7 rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/55 hover:text-white",
            !anime.favorito && "opacity-0 group-hover:opacity-100 focus:opacity-100",
          )}
          aria-label={
            anime.favorito ? "Quitar de favoritos" : "Marcar como favorito"
          }
          disabled={favoritoPendiente}
          onClick={onAlternarFavorito}
        >
          <Star
            className={cn("size-3.5", anime.favorito && "fill-current text-amber-300")}
          />
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute bottom-24 right-2 size-7 rounded-full bg-black/35 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/55 hover:text-white group-hover:opacity-100 focus:opacity-100"
        aria-label={`Editar ${titulo}`}
        onClick={onEditar}
      >
        <Pencil className="size-3" />
      </Button>
    </div>
  )
}
