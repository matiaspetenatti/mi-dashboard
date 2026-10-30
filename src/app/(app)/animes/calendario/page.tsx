import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CalendarioSemanal } from "@/modules/animes/calendario/calendario-semanal";
import { requireAuthorizedUser } from "@/lib/auth";

export default async function CalendarioAnimesPage() {
  await requireAuthorizedUser();

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
            Calendario de estrenos
          </h1>
          <p className="mt-1 max-w-xl text-sm text-charcoal">
            Horarios de los animes que estoy viendo, en la zona horaria de
            Argentina.
          </p>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-on-surface-variant">
              Cargando calendario...
            </p>
          </div>
        }
      >
        <CalendarioSemanal />
      </Suspense>
    </div>
  );
}
