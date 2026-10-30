import { Suspense } from "react";
import { connection } from "next/server";
import { Calendar } from "lucide-react";
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
import { ClimaWidget, ClimaWidgetSkeleton } from "@/modules/clima/widget";
import { SaludWidget, SaludWidgetSkeleton } from "@/modules/salud/widget";
import { AnimesWidget, AnimesWidgetSkeleton } from "@/modules/animes/widget";
import { HubOnboarding } from "@/components/hub-onboarding";

export default async function HubPage() {
  // El saludo depende de la hora del servidor: esperamos la request para no
  // congelar un valor "inestable" (new Date()) durante el prerender.
  await connection();

  const ahora = new Date();
  const hora = ahora.getHours();
  const saludo =
    hora < 12
      ? "Buen día"
      : hora < 20
        ? "Buenas tardes"
        : "Buenas noches";

  const fecha = ahora
    .toLocaleDateString("es-AR", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    .replace(/^\w/, (c) => c.toUpperCase()); // "Viernes, 30 de octubre"

  return (
    <div className="flex flex-col gap-10">
      {/* ── Header del hub ────────────────────────────────────────── */}
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary-container/20 bg-linen-mist px-3 py-1 text-xs font-bold tracking-tight text-forest-ink dark:border-lime-voltage/30 dark:bg-forest-ink dark:text-lime-voltage dark:shadow-[0_0_10px_rgba(159,232,112,0.12)]">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-secondary dark:bg-lime-voltage dark:shadow-[0_0_6px_#9fe870]"
            />
            Tu espacio personal
          </div>

          <h1 className="text-[32px] font-black leading-[36px] tracking-tight text-heading md:text-[61px] md:leading-[68px]">
            {saludo}{" "}
            <span role="img" aria-label="saludo">
              👋
            </span>
          </h1>

          <p className="max-w-xl text-[18px] leading-7 tracking-[-0.007em] text-charcoal">
            Un vistazo rápido a tus tareas, finanzas y estudio.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-full border border-outline-variant bg-card px-4 py-2 text-xs font-bold text-heading shadow-sm md:self-end">
          <Calendar size={15} className="shrink-0 text-primary" />
          <span>{fecha}</span>
        </div>
      </header>

      <HubOnboarding />

      {/* ── Cuadrícula de widgets del hub ─────────────────────────── */}
      <section
        aria-label="Panel de widgets del hub"
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {/* ── WIDGET: Tareas ──────────────────────────────────────── */}
        <div className="min-w-0">
          <Suspense fallback={<TareasWidgetSkeleton />}>
            <TareasWidget />
          </Suspense>
        </div>

        {/* ── WIDGET: Finanzas ────────────────────────────────────── */}
        <div className="min-w-0">
          <Suspense fallback={<FinanzasWidgetSkeleton />}>
            <FinanzasWidget />
          </Suspense>
        </div>

        {/* ── WIDGET: Estudio ─────────────────────────────────────── */}
        <div className="min-w-0">
          <Suspense fallback={<EstudioWidgetSkeleton />}>
            <EstudioWidget />
          </Suspense>
        </div>

        {/* ── WIDGET: Clima ───────────────────────────────────────── */}
        <div className="min-w-0">
          <Suspense fallback={<ClimaWidgetSkeleton />}>
            <ClimaWidget />
          </Suspense>
        </div>

        {/* ── WIDGET: Salud ───────────────────────────────────────── */}
        <div className="min-w-0">
          <Suspense fallback={<SaludWidgetSkeleton />}>
            <SaludWidget />
          </Suspense>
        </div>

        {/* ── WIDGET: Animes & Entretenimiento ────────────────────── */}
        <div className="min-w-0">
          <Suspense fallback={<AnimesWidgetSkeleton />}>
            <AnimesWidget />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
