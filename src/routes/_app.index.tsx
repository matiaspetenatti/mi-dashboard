import { createFileRoute, Link } from "@tanstack/react-router"
import {
  Activity,
  CheckSquare,
  Plus,
  Wallet,
} from "lucide-react"

import { PageHeader } from "@/components/organisms/page-header"
import { WidgetAnimes } from "@/features/animes/components/widget-animes"
import { WidgetClima } from "@/features/clima/components/widget-clima"
import { WidgetEstudio } from "@/features/estudio/components/widget-estudio"
import { WidgetFinanzas } from "@/features/finanzas/components/widget-finanzas"
import { WidgetTareas } from "@/features/tareas/components/widget-tareas"
import { useQuickAdd } from "@/features/tareas/components/quick-add-provider"
import { resumenAnimesQuery } from "@/features/animes/api"
import { resumenClimaQuery } from "@/features/clima/api"
import { resumenEstudioQuery } from "@/features/estudio/api"
import { resumenFinanzasQuery } from "@/features/finanzas/api"
import { resumenTareasQuery } from "@/features/tareas/api"
import { Button, buttonVariants } from "@/components/ui/button"
import { fechaLarga, saludoDelDia } from "@/lib/dates"
import { cn } from "cn"

export const Route = createFileRoute("/_app/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(resumenTareasQuery),
      context.queryClient.prefetchQuery(resumenFinanzasQuery),
      context.queryClient.prefetchQuery(resumenEstudioQuery),
      context.queryClient.prefetchQuery(resumenClimaQuery),
      context.queryClient.prefetchQuery(resumenAnimesQuery),
    ])
  },
  component: InicioPage,
})

function InicioPage() {
  const fecha = fechaLarga()
  const saludo = saludoDelDia()
  const { open: openQuickAdd } = useQuickAdd()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Tu espacio personal"
        title={
          <>
            {saludo} <span aria-hidden="true">👋</span>
          </>
        }
        description="Un vistazo rápido a tus tareas, finanzas, estudio y el resto de tu día."
        meta={fecha}
        actions={
          <Button
            type="button"
            variant="default"
            size="sm"
            className="h-10 rounded-full px-5 text-xs font-bold"
            onClick={openQuickAdd}
          >
            <Plus className="size-4" aria-hidden="true" />
            Nueva tarea
          </Button>
        }
      />

      <section aria-label="Acciones rápidas" className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-full px-4 text-xs font-bold"
          onClick={openQuickAdd}
        >
          <CheckSquare className="size-4" aria-hidden="true" />
          Registrar tarea
        </Button>
        <Link
          to="/finanzas"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-9 rounded-full px-4 text-xs font-bold",
          )}
        >
          <Wallet className="size-4" aria-hidden="true" />
          Registrar gasto
        </Link>
        <Link
          to="/salud"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-9 rounded-full px-4 text-xs font-bold",
          )}
        >
          <Activity className="size-4" aria-hidden="true" />
          Registrar actividad
        </Link>
      </section>

      <section
        aria-label="Resumen de módulos"
        className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
      >
        <WidgetTareas />
        <WidgetFinanzas />
        <WidgetEstudio />
        <WidgetClima />
        <WidgetAnimes />
      </section>
    </div>
  )
}
