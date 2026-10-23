import { GraduationCap } from "lucide-react";
import { WidgetCard } from "@/components/widget-card";
import { CountUp } from "@/components/motion/count-up";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { diasHasta } from "@/lib/format";
import { getProximoExamen } from "./queries";

export function EstudioWidgetSkeleton() {
  return (
    <WidgetCard
      title="Próximo examen"
      href="/estudio"
      icon={GraduationCap}
      accent="tertiary"
    >
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="mt-4 h-10 w-24" />
      </div>
    </WidgetCard>
  );
}

export async function EstudioWidget() {
  const proximo = await getProximoExamen();
  const dias = proximo ? Math.max(0, diasHasta(proximo.fecha, proximo.hoy)) : 0;

  return (
    <WidgetCard
      title="Próximo examen"
      href="/estudio"
      icon={GraduationCap}
      accent="tertiary"
    >
      {proximo ? (
        <>
          <Badge variant="tertiary" className="w-fit capitalize">
            {proximo.tipo} · {proximo.fecha}
          </Badge>
          <p className="mt-3 text-lg font-medium leading-snug text-on-surface">
            {proximo.materia}
          </p>

          <div className="mt-auto flex items-baseline gap-2 pt-4">
            <CountUp
              value={dias}
              className="text-4xl font-medium leading-none tracking-tight text-on-surface"
            />
            <span className="text-sm text-on-surface-variant">
              {dias === 0
                ? "es hoy"
                : dias === 1
                  ? "día restante"
                  : "días restantes"}
            </span>
          </div>
        </>
      ) : (
        <div className="rounded-2xl bg-tertiary-container/45 px-3 py-3 text-sm text-on-tertiary-container">
          Sin exámenes cargados por delante.
        </div>
      )}
    </WidgetCard>
  );
}
