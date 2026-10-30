import { Suspense } from "react";
import { AnimesPageWrapper } from "@/modules/animes/page-wrapper";
import { requireAuthorizedUser } from "@/lib/auth";

export default async function AnimesPage() {
  await requireAuthorizedUser();

  return (
    <div className="space-y-7">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-wider text-pebble">
          Biblioteca personal
        </p>
        <h1 className="mt-0.5 text-4xl font-extrabold tracking-tight text-heading lg:text-5xl">
          Animes
        </h1>
        <p className="mt-1 max-w-xl text-sm text-charcoal">
          Mi catálogo de animes vistos: puntajes, temporadas y progreso en un
          solo lugar.
        </p>
      </header>

      <Suspense
        fallback={
          <p className="text-sm text-on-surface-variant">Cargando catálogo...</p>
        }
      >
        <AnimesPageWrapper />
      </Suspense>
    </div>
  );
}
