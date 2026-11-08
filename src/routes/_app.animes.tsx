import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { z } from "zod"

import { WorkspaceAnimes } from "@/features/animes/components/workspace-animes"
import { workspaceAnimesQuery } from "@/features/animes/api"

const searchSchema = z.object({
  vista: z.enum(["biblioteca", "estadisticas", "calendario"]).optional(),
})

export const Route = createFileRoute("/_app/animes")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Animes · Mi Dashboard" }] }),
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(workspaceAnimesQuery)
  },
  component: AnimesPage,
})

function AnimesPage() {
  const { data } = useSuspenseQuery(workspaceAnimesQuery)
  const { vista } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <WorkspaceAnimes
      workspace={data}
      vista={vista ?? "biblioteca"}
      onCambiarVista={(siguiente) => {
        void navigate({
          search: (prev) => ({ ...prev, vista: siguiente }),
          replace: true,
        })
      }}
    />
  )
}
