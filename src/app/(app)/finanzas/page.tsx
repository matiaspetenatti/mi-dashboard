import { Suspense } from "react";
import { FinanzasContenido, FinanzasSkeleton } from "@/modules/finanzas/contenido";
import { requireAuthorizedUser } from "@/lib/auth";

export default async function FinanzasPage() {
  await requireAuthorizedUser();

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Finanzas
        </h1>
      </div>

      <Suspense fallback={<FinanzasSkeleton />}>
        <FinanzasContenido />
      </Suspense>
    </div>
  );
}
