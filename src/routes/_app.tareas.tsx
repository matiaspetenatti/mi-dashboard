import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { z } from "zod"

import { WorkspaceTareas } from "@/features/tareas/components/workspace-tareas"
import { workspaceTareasQuery } from "@/features/tareas/api"

const searchSchema = z.object({
  proyecto: z.string().optional(),
})

export const Route = createFileRoute("/_app/tareas")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Tareas · Mi Dashboard" }] }),
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(workspaceTareasQuery)
  },
  component: TareasPage,
})

function TareasPage() {
  const { data } = useSuspenseQuery(workspaceTareasQuery)
  const { proyecto } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <WorkspaceTareas
      workspace={data}
      proyectoSlug={proyecto ?? null}
      onSeleccionarProyecto={(slug) => {
        void navigate({
          search: (prev) => ({ ...prev, proyecto: slug ?? undefined }),
          replace: true,
        })
      }}
    />
  )
}
