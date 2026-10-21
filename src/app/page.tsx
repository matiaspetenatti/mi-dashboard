import { Suspense } from "react";
import { TareasWidget, TareasWidgetSkeleton } from "@/modules/tareas/widget";
import { FinanzasWidget, FinanzasWidgetSkeleton } from "@/modules/finanzas/widget";
import { EstudioWidget, EstudioWidgetSkeleton } from "@/modules/estudio/widget";

export default function HubPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Buen día 👋</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Suspense fallback={<TareasWidgetSkeleton />}>
          <TareasWidget />
        </Suspense>
        <Suspense fallback={<FinanzasWidgetSkeleton />}>
          <FinanzasWidget />
        </Suspense>
        <Suspense fallback={<EstudioWidgetSkeleton />}>
          <EstudioWidget />
        </Suspense>
      </div>
    </div>
  );
}