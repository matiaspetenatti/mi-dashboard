import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { z } from "zod"

import { WorkspaceComida } from "@/features/comida/components/workspace-comida"
import { workspaceComidaQuery } from "@/features/comida/api"
import { semanaComida } from "@/features/comida/lib/semana"

const searchSchema = z.object({
  vista: z.enum(["despensa", "recetario", "menu", "compras"]).optional(),
  semana: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

export const Route = createFileRoute("/_app/comida")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ semana: search.semana }),
  head: () => ({ meta: [{ title: "Comida · Mi Dashboard" }] }),
  loader: async ({ context, deps }) => {
    const semana = semanaComida(deps.semana)
    await context.queryClient.prefetchQuery(workspaceComidaQuery(semana))
  },
  component: ComidaPage,
})

function ComidaPage() {
  const { vista, semana: semanaParam } = Route.useSearch()
  const semana = semanaComida(semanaParam)
  const { data } = useSuspenseQuery(workspaceComidaQuery(semana))
  const navigate = Route.useNavigate()

  return (
    <WorkspaceComida
      workspace={data}
      vista={vista ?? "despensa"}
      onCambiarVista={(siguiente) => {
        void navigate({
          search: (prev) => ({ ...prev, vista: siguiente }),
          replace: true,
        })
      }}
      onCambiarSemana={(siguiente) => {
        void navigate({
          search: (prev) => ({ ...prev, semana: siguiente }),
          replace: true,
        })
      }}
    />
  )
}
