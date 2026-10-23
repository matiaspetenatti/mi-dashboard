import { Suspense } from "react";
import { CalendarioSemanal } from "@/modules/animes/calendario/calendario-semanal";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuthorizedUser } from "@/lib/auth";

export default async function CalendarioAnimesPage() {
  await requireAuthorizedUser();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/animes"
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Volver al catálogo"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Calendario de estrenos</h1>
            <p className="text-sm text-neutral-500">
              Horarios de los animes que estoy viendo - Zona horaria de Argentina
            </p>
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-neutral-500">Cargando...</p>
          </div>
        }
      >
        <CalendarioSemanal />
      </Suspense>
    </div>
  );
}
