import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { z } from "zod"

import { WorkspaceEstudio } from "@/features/estudio/components/workspace-estudio"
import { workspaceEstudioQuery } from "@/features/estudio/api"

const searchSchema = z.object({
  carrera: z.coerce.number().int().positive().optional(),
})

export const Route = createFileRoute("/_app/estudio")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Estudio · Mi Dashboard" }] }),
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(workspaceEstudioQuery)
  },
  component: EstudioPage,
})

function EstudioPage() {
  const { data } = useSuspenseQuery(workspaceEstudioQuery)
  const { carrera } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <WorkspaceEstudio
      workspace={data}
      carreraId={carrera ?? null}
      onSeleccionarCarrera={(id) => {
        void navigate({
          search: (prev) => ({ ...prev, carrera: id ?? undefined }),
          replace: true,
        })
      }}
    />
  )
}
