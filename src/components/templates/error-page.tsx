import { Link, type ErrorComponentProps } from "@tanstack/react-router"
import { AlertTriangle, Home, RotateCcw } from "lucide-react"
import type { ReactNode } from "react"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg rounded-3xl border border-outline-variant/60 bg-card p-8 text-center shadow-elevation-1">
        {children}
      </div>
    </main>
  )
}

export function RootError({ error, reset }: ErrorComponentProps) {
  return (
    <Shell>
      <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-error-container text-error">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-black tracking-tight text-heading">
        Algo salió mal
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error instanceof Error && error.message
          ? error.message
          : "No pudimos cargar esta pantalla. Probá de nuevo."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button variant="default" onClick={reset}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Reintentar
        </Button>
        <Link
          to="/"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "rounded-full",
          )}
        >
          <Home className="size-4" aria-hidden="true" />
          Ir al inicio
        </Link>
      </div>
    </Shell>
  )
}

export function NotFound() {
  return (
    <Shell>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        404
      </p>
      <h1 className="mt-2 text-2xl font-black tracking-tight text-heading">
        Esta pantalla no existe
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Puede que el enlace esté mal o que la sección todavía no exista.
      </p>
      <Link
        to="/"
        className={cn(
          buttonVariants({ variant: "default" }),
          "mt-6 rounded-full px-5",
        )}
      >
        <Home className="size-4" aria-hidden="true" />
        Volver al inicio
      </Link>
    </Shell>
  )
}
