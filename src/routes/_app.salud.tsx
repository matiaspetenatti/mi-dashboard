import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { z } from "zod"

import { WorkspaceSalud } from "@/features/salud/components/workspace-salud"
import { workspaceSaludQuery } from "@/features/salud/api"

const searchSchema = z.object({
  vista: z.enum(["migrana", "bienestar"]).optional(),
})

export const Route = createFileRoute("/_app/salud")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Salud · Mi Dashboard" }] }),
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(workspaceSaludQuery)
  },
  component: SaludPage,
})

function SaludPage() {
  const { data } = useSuspenseQuery(workspaceSaludQuery)
  const { vista } = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <WorkspaceSalud
      workspace={data}
      vista={vista ?? "migrana"}
      onCambiarVista={(siguiente) => {
        void navigate({
          search: (prev) => ({ ...prev, vista: siguiente }),
          replace: true,
        })
      }}
    />
  )
}
