import { useClerk } from "@clerk/tanstack-react-start"
import { createFileRoute } from "@tanstack/react-router"
import { LogOut, Settings2, UserRound } from "lucide-react"

import { PageHeader } from "@/components/organisms/page-header"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/molecules/theme-toggle"

export const Route = createFileRoute("/_app/ajustes")({
  component: AjustesPage,
})

function AjustesPage() {
  const { viewer } = Route.useRouteContext()
  const { signOut } = useClerk()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Preferencias"
        title="Ajustes"
        description="Tu cuenta, el tema y la configuración general del dashboard."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-3xl border border-outline-variant/60 bg-card p-6 shadow-elevation-1">
          <div className="mb-4 flex items-center gap-2">
            <UserRound className="size-4 text-secondary" aria-hidden="true" />
            <h2 className="text-sm font-black text-heading">Cuenta</h2>
          </div>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Nombre
              </dt>
              <dd className="mt-0.5 font-semibold text-on-surface">
                {viewer.name ?? "Sin nombre"}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Email autorizado
              </dt>
              <dd className="mt-0.5 font-semibold text-on-surface">
                {viewer.email}
              </dd>
            </div>
          </dl>
          <Button
            variant="outline"
            className="mt-6 h-9 rounded-full px-4 text-xs font-bold"
            onClick={() => void signOut({ redirectUrl: "/sign-in" })}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Cerrar sesión
          </Button>
        </section>

        <section className="rounded-3xl border border-outline-variant/60 bg-card p-6 shadow-elevation-1">
          <div className="mb-4 flex items-center gap-2">
            <Settings2 className="size-4 text-secondary" aria-hidden="true" />
            <h2 className="text-sm font-black text-heading">Apariencia</h2>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            El dashboard respeta el tema del sistema. Podés alternar entre claro
            y oscuro cuando quieras.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <ThemeToggle />
            <span className="text-xs font-semibold text-muted-foreground">
              Cambiar tema
            </span>
          </div>
        </section>
      </div>
    </div>
  )
}
