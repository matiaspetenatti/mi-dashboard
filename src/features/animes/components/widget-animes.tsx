import { Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Play, Tv } from "lucide-react"

import { WidgetCard } from "@/components/organisms/widget-card"
import { WidgetError, WidgetLoading } from "@/components/molecules/widget-states"
import { resumenAnimesQuery } from "@/features/animes/api"

export function WidgetAnimes() {
  const { data, isPending, isError } = useQuery(resumenAnimesQuery)

  return (
    <WidgetCard
      title="Animes"
      subtitle="En emisión y en curso"
      href="/animes"
      icon={Tv}
      accent="primary"
      footer={
        <>
          <span>
            {data
              ? `${data.episodiosVistos} episodios vistos`
              : "Cargando..."}
          </span>
          <span>Kitsu · Tu progreso</span>
        </>
      }
    >
      {isPending ? <WidgetLoading /> : null}

      {isError ? (
        <WidgetError message="No se pudo cargar tu catálogo." />
      ) : null}

      {data ? (
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-end gap-2">
            <span className="text-display text-5xl leading-none text-heading">
              {data.viendo}
            </span>
            <span className="pb-1 text-xs font-semibold text-muted-foreground">
              {data.viendo === 1 ? "anime en curso" : "animes en curso"}
            </span>
          </div>

          {data.items.length === 0 ? (
            <div className="mt-auto rounded-2xl bg-surface-container-low p-3 text-[10px] font-semibold text-muted-foreground">
              Todavía no marcaste ningún anime como “viendo”.{" "}
              <Link to="/animes" className="font-bold text-heading underline underline-offset-4">
                Agregar uno
              </Link>
            </div>
          ) : (
            <ul className="mt-auto flex flex-col gap-2">
              {data.items.map((anime) => {
                const total = anime.episodios ?? 0
                const avance =
                  total > 0
                    ? Math.min(100, Math.round((anime.episodiosVistos / total) * 100))
                    : 0

                return (
                  <li
                    key={anime.id}
                    className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-2"
                  >
                    <img
                      src={anime.imagen}
                      alt=""
                      width={36}
                      height={48}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="h-12 w-9 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-heading">
                        {anime.titulo}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-card">
                          <div
                            className="h-full rounded-full bg-lime-voltage"
                            style={{ width: `${Math.max(3, avance)}%` }}
                          />
                        </div>
                        <span className="tabular shrink-0 text-[9px] font-bold text-muted-foreground">
                          {anime.episodiosVistos}/{total || "?"}
                        </span>
                      </div>
                    </div>
                    <Play className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}
    </WidgetCard>
  )
}
