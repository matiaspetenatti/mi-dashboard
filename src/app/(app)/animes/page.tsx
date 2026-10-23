import { Suspense } from "react";
import { AnimesPageWrapper } from "@/modules/animes/page-wrapper";
import { requireAuthorizedUser } from "@/lib/auth";

export default async function AnimesPage() {
  await requireAuthorizedUser();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Animes</h1>
          <p className="text-sm text-neutral-500">Mi catálogo de animes vistos</p>
        </div>
      </div>

      <Suspense fallback={<p className="text-sm text-neutral-500">Cargando...</p>}>
        <AnimesPageWrapper />
      </Suspense>
    </div>
  );
}
