import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"

import { WorkspaceFinanzas } from "@/features/finanzas/components/workspace-finanzas"
import {
  movimientosFinanzasQuery,
  workspaceFinanzasQuery,
} from "@/features/finanzas/api"
import { MOVIMIENTOS_FINANZAS_INICIALES } from "@/features/finanzas/schemas"

export const Route = createFileRoute("/_app/finanzas")({
  head: () => ({ meta: [{ title: "Finanzas · Mi Dashboard" }] }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(workspaceFinanzasQuery),
      context.queryClient.prefetchQuery(
        movimientosFinanzasQuery(MOVIMIENTOS_FINANZAS_INICIALES),
      ),
    ])
  },
  component: FinanzasPage,
})

function FinanzasPage() {
  const { data } = useSuspenseQuery(workspaceFinanzasQuery)
  return <WorkspaceFinanzas workspace={data} />
}
