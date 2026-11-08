import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { CloudSun, RotateCcw } from "lucide-react"

import { PageHeader } from "@/components/organisms/page-header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { WorkspaceClima } from "@/features/clima/components/workspace-clima"
import { workspaceClimaQuery } from "@/features/clima/api"

export const Route = createFileRoute("/_app/clima")({
  head: () => ({ meta: [{ title: "Clima · Mi Dashboard" }] }),
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(workspaceClimaQuery)
  },
  component: ClimaPage,
})

function ClimaPage() {
  const { data, isPending, isError, refetch } = useQuery(workspaceClimaQuery)

  if (isPending) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Pronóstico"
          title="Clima"
          description="Cargando el clima actual y el pronóstico extendido..."
        />
        <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
        </div>
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Pronóstico"
          title="Clima"
          description="No se pudo cargar el clima."
        />
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-outline-variant/70 bg-card/50 px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-error-container text-error">
            <CloudSun className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-black text-heading">
              El servicio de clima no respondió
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Probá de nuevo en unos segundos.
            </p>
          </div>
          <Button variant="outline" onClick={() => void refetch()}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return <WorkspaceClima workspace={data} />
}
