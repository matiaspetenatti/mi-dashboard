import { Suspense } from "react";
import { Activity } from "lucide-react";
import { requireAuthorizedUser } from "@/lib/auth";
import { HabitosContenido } from "@/modules/habitos/contenido";
import { HabitosWidgetSkeleton } from "@/modules/habitos/widget";

export const instant = false;

export default async function HabitosPage() {
  await requireAuthorizedUser();

  return (
    <div className="space-y-7">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-wider text-pebble">
          Hábitos
        </p>
        <h1 className="mt-0.5 text-4xl font-extrabold tracking-tight text-heading lg:text-5xl">
          Hábitos
        </h1>
        <p className="mt-1 max-w-xl text-sm text-charcoal">
          Trackeá tus hábitos diarios, llevá rachas y sincronizá tu actividad
          de GitHub.
        </p>
      </header>

      <Suspense fallback={<HabitosWidgetSkeleton />}>
        <HabitosContenido />
      </Suspense>
    </div>
  );
}
