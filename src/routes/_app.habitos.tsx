import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"

import { WorkspaceHabitos } from "@/features/habitos/components/workspace-habitos"
import { workspaceHabitosQuery } from "@/features/habitos/api"

export const Route = createFileRoute("/_app/habitos")({
  head: () => ({ meta: [{ title: "Hábitos · Mi Dashboard" }] }),
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(workspaceHabitosQuery)
  },
  component: HabitosPage,
})

function HabitosPage() {
  const { data } = useSuspenseQuery(workspaceHabitosQuery)
  return <WorkspaceHabitos workspace={data} />
}
