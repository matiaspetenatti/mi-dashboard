import { requireAuthorizedUser } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  animesPorEstado,
  animesPorAno,
  animesPorGenero,
  animesPorEstudio,
  animesPorFuente,
  animesPorFormato,
  promedioPorGenero,
  topAnimes,
  comparativaScores,
  horasEstimadas,
  mejorGenero,
} from "@/modules/animes/queries/estadisticas";
import { AnimesEstadisticas } from "@/modules/animes/estadisticas";

export const instant = false;

export default async function AnimesEstadisticasPage() {
  await requireAuthorizedUser();

  const [
    porEstado,
    porAno,
    porGenero,
    porEstudio,
    porFuente,
    porFormato,
    promedios,
    top,
    comparativa,
    horas,
    mejor,
  ] = await Promise.all([
    animesPorEstado(),
    animesPorAno(),
    animesPorGenero(),
    animesPorEstudio(),
    animesPorFuente(),
    animesPorFormato(),
    promedioPorGenero(),
    topAnimes(10),
    comparativaScores(),
    horasEstimadas(),
    mejorGenero(),
  ]);

  return (
    <div className="space-y-7">
      <header className="flex items-start gap-3">
        <Link
          href="/animes"
          className="mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-outline-variant/60 bg-card text-charcoal transition-colors hover:bg-surface-container active:scale-[0.98]"
          aria-label="Volver al catálogo"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-pebble">
            Animes
          </p>
          <h1 className="mt-0.5 text-4xl font-extrabold tracking-tight text-heading lg:text-5xl">
            Estadísticas
          </h1>
          <p className="mt-1 max-w-xl text-sm text-charcoal">
            Distribución, puntajes e insights de tu catálogo.
          </p>
        </div>
      </header>

      <AnimesEstadisticas
        porEstado={porEstado}
        porAno={porAno}
        porGenero={porGenero}
        porEstudio={porEstudio}
        porFuente={porFuente}
        porFormato={porFormato}
        promedios={promedios}
        top={top}
        comparativa={comparativa}
        horas={horas}
        mejor={mejor}
      />
    </div>
  );
}