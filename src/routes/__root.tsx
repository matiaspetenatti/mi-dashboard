import { TanStackDevtools } from "@tanstack/react-devtools"
import type { QueryClient } from "@tanstack/react-query"
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { ThemeProvider } from "next-themes"
import type { ReactNode } from "react"

import { AppClerkProvider } from "@/components/providers/clerk-provider"
import { NotFound, RootError } from "@/components/templates/error-page"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import appCss from "@/styles/app.css?url"

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  errorComponent: RootError,
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "Mi Dashboard" },
      {
        name: "description",
        content: "Panel personal para tareas, finanzas, estudio y más.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-on-surface antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppClerkProvider>
            <TooltipProvider delay={200}>
              {children}
              <Toaster />
            </TooltipProvider>
          </AppClerkProvider>
        </ThemeProvider>
        <TanStackDevtools
          config={{ position: "bottom-right" }}
          plugins={[
            {
              name: "TanStack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
