import type { ReactNode } from "react"

import { AppSidebar, type SidebarViewer } from "@/components/organisms/app-sidebar"
import { AppTopbar } from "@/components/organisms/app-topbar"
import { QuickAddProvider } from "@/features/tareas/components/quick-add-provider"

export function AppShell({
  viewer,
  children,
}: {
  viewer: SidebarViewer
  children: ReactNode
}) {
  return (
    <div className="flex min-h-svh bg-background">
      <AppSidebar viewer={viewer} />
      <QuickAddProvider>
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar />
          <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 md:px-8 md:py-8">
            {children}
          </main>
          <footer className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-4 pb-6 text-[11px] text-muted-foreground md:px-8">
            <span>Mi Dashboard · Datos personales</span>
            <span className="hidden sm:inline">Hecho para tener todo a mano</span>
          </footer>
        </div>
      </QuickAddProvider>
    </div>
  )
}
