import { useClerk } from "@clerk/tanstack-react-start"
import { createFileRoute } from "@tanstack/react-router"
import { ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/acceso-denegado")({
  component: AccesoDenegadoPage,
})

function AccesoDenegadoPage() {
  const { signOut } = useClerk()

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl border border-outline-variant/60 bg-card p-8 text-center shadow-elevation-1">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-error-container text-error">
          <ShieldAlert className="size-6" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-black tracking-tight text-heading">
          Acceso denegado
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La cuenta con la que iniciaste sesión no está autorizada para este
          dashboard.
        </p>
        <Button
          className="mt-6"
          variant="default"
          onClick={() => void signOut({ redirectUrl: "/sign-in" })}
        >
          Cerrar sesión
        </Button>
      </div>
    </main>
  )
}
