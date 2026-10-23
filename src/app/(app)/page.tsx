import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TodayLabel } from "@/components/today-label";
import { HoverLift } from "@/components/motion/hover-lift";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import {
  TareasWidget,
  TareasWidgetSkeleton,
} from "@/modules/tareas/widget";
import {
  FinanzasWidget,
  FinanzasWidgetSkeleton,
} from "@/modules/finanzas/widget";
import {
  EstudioWidget,
  EstudioWidgetSkeleton,
} from "@/modules/estudio/widget";
import { requireAuthorizedUser } from "@/lib/auth";

export default async function HubPage() {
  await requireAuthorizedUser();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-container px-3 py-1 text-xs font-medium text-on-primary-container">
            <Sparkles size={13} />
            Tu espacio personal
          </span>
        }
        title="Buen día 👋"
        description="Un vistazo rápido a tus tareas, finanzas y estudio."
        actions={
          <Suspense
            fallback={
              <span className="rounded-full bg-surface-container px-4 py-2 text-sm text-on-surface-variant">
                Hoy
              </span>
            }
          >
            <TodayLabel />
          </Suspense>
        }
      />

      <Stagger className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StaggerItem className="h-full">
          <HoverLift className="h-full">
            <Suspense fallback={<TareasWidgetSkeleton />}>
              <TareasWidget />
            </Suspense>
          </HoverLift>
        </StaggerItem>

        <StaggerItem className="h-full">
          <HoverLift className="h-full">
            <Suspense fallback={<FinanzasWidgetSkeleton />}>
              <FinanzasWidget />
            </Suspense>
          </HoverLift>
        </StaggerItem>

        <StaggerItem className="h-full sm:col-span-2 xl:col-span-1">
          <HoverLift className="h-full">
            <Suspense fallback={<EstudioWidgetSkeleton />}>
              <EstudioWidget />
            </Suspense>
          </HoverLift>
        </StaggerItem>
      </Stagger>
    </div>
  );
}
