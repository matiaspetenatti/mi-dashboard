import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"

import { WorkspaceFinanzas } from "@/features/finanzas/components/workspace-finanzas"
import { workspaceFinanzasQuery } from "@/features/finanzas/api"

export const Route = createFileRoute("/_app/finanzas")({
  head: () => ({ meta: [{ title: "Finanzas · Mi Dashboard" }] }),
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(workspaceFinanzasQuery)
  },
  component: FinanzasPage,
})

function FinanzasPage() {
  const { data } = useSuspenseQuery(workspaceFinanzasQuery)
  return <WorkspaceFinanzas workspace={data} />
}
