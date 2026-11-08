import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { AppShell } from "@/components/templates/app-shell"
import { getViewer } from "@/server/functions/auth"

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    const viewer = await getViewer()

    if (viewer.status === "signed-out") {
      throw redirect({ to: "/sign-in" })
    }

    if (viewer.status === "forbidden") {
      throw redirect({ to: "/acceso-denegado" })
    }

    return { viewer }
  },
  component: AppLayout,
})

function AppLayout() {
  const { viewer } = Route.useRouteContext()

  return (
    <AppShell viewer={viewer}>
      <Outlet />
    </AppShell>
  )
}
