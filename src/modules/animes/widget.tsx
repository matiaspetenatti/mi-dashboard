import Link from "next/link";
import { PlayCircle, Tv } from "lucide-react";
import { cn } from "cn";
import { WidgetCard } from "@/components/widget-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAnimesVistos } from "./queries";
import type { AnimeVisto } from "./schema";

const estadoLabel: Record<string, string> = {
  viendo: "Viendo",
  completado: "Completado",
  en_pausa: "En pausa",
  abandonado: "Abandonado",
};

const estadoStyle: Record<string, string> = {
  viendo: "bg-lime-voltage text-forest-ink",
  completado: "bg-secondary-container text-on-secondary-container",
  en_pausa: "bg-surface-container text-on-surface-variant",
  abandonado: "bg-error-container text-on-error-container",
};

export function AnimesWidgetSkeleton() {
  return (
    <WidgetCard
      title="Animes"
      subtitle="Cargando seguimiento"
      href="/animes"
      icon={Tv}
      accent="primary"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Skeleton className="h-[122px] w-full rounded-[16px]" />
        <Skeleton className="h-[122px] w-full rounded-[16px]" />
      </div>
    </WidgetCard>
  );
}

export function AnimesWidgetError() {
  return (
    <WidgetCard
      title="Animes"
      subtitle="Seguimiento de temporada"
      href="/animes"
      icon={Tv}
      accent="primary"
    >
      <div className="flex flex-1 flex-col justify-center gap-1 py-6 text-center">
        <Tv className="mx-auto h-6 w-6 text-on-surface-variant opacity-60" />
        <p className="text-sm font-medium text-on-surface">
          No se pudieron cargar los animes
        </p>
        <p className="text-xs text-on-surface-variant">
          Entrá al módulo de Animes para reintentar.
        </p>
      </div>
    </WidgetCard>
  );
}

export async function AnimesWidget() {
  let animes: AnimeVisto[] = [];
  let total = 0;

  try {
    const resultado = await getAnimesVistos({
      estado: "viendo",
      limite: 2,
      ordenarPor: "agregado_desc",
    });
    animes = resultado.animes;
    total = resultado.total;
  } catch {
    return <AnimesWidgetError />;
  }

  return (
    <WidgetCard
      title="Animes"
      subtitle={
        total > 0 ? `${total} en seguimiento` : "Seguimiento de temporada"
      }
      href="/animes"
      icon={Tv}
      accent="primary"
      footer={
        <>
          <span>Actualizado con tu biblioteca</span>
          <Link
            href="/animes"
            className="inline-flex items-center gap-1 font-bold text-primary transition-opacity hover:opacity-75"
          >
            Ver catálogo →
          </Link>
        </>
      }
    >
      {animes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[16px] border border-dashed border-outline-variant/70 bg-surface-bright px-4 py-8 text-center">
          <Tv size={22} className="text-primary" />
          <p className="text-sm font-semibold text-heading">
            Sin animes en seguimiento
          </p>
          <p className="text-xs text-on-surface-variant">
            Marcá uno como “Viendo” desde el módulo de Animes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {animes.map((anime) => {
            const vistos = anime.episodiosVistos ?? 0;
            const totalEpisodios = anime.episodios ?? 0;
            const progreso =
              totalEpisodios > 0
                ? Math.min(100, Math.round((vistos / totalEpisodios) * 100))
                : 0;

            return (
              <Link
                key={anime.id}
                href="/animes"
                className="flex flex-col justify-between gap-3 rounded-[16px] border border-outline-variant/60 bg-surface-bright p-3.5 transition-colors duration-200 hover:bg-surface-container"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        estadoStyle[anime.estado] ?? estadoStyle.completado,
                      )}
                    >
                      {estadoLabel[anime.estado] ?? anime.estado}
                    </span>
                    <h3 className="mt-1.5 line-clamp-2 text-sm font-bold text-heading">
                      {anime.tituloIngles || anime.titulo}
                    </h3>
                    <p className="mt-0.5 truncate text-[11px] text-charcoal">
                      {totalEpisodios > 0
                        ? `Episodio ${vistos} de ${totalEpisodios}`
                        : `${vistos} ${vistos === 1 ? "episodio visto" : "episodios vistos"}`}
                    </p>
                  </div>
                  <PlayCircle
                    size={20}
                    className="shrink-0 text-primary"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-on-surface-variant">
                    <span>Progreso</span>
                    <span>
                      {totalEpisodios > 0
                        ? `${vistos} / ${totalEpisodios} episodios`
                        : `${progreso}%`}
                    </span>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-surface-container"
                    role="progressbar"
                    aria-valuenow={progreso}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </WidgetCard>
  );
}
