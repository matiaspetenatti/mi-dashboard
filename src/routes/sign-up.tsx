import { createFileRoute, Link } from "@tanstack/react-router"
import { Lock } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
})

function SignUpPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl border border-outline-variant/60 bg-card p-8 text-center shadow-elevation-1">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-linen-mist text-forest-ink dark:bg-primary-container dark:text-lime-voltage">
          <Lock className="size-6" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-black tracking-tight text-heading">
          Registro deshabilitado
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este dashboard es personal y solo admite la cuenta autorizada. Si ya
          tenés acceso, iniciá sesión.
        </p>
        <Link
          to="/sign-in"
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "mt-6 h-10 rounded-full px-5 text-xs font-bold",
          )}
        >
          Ir a iniciar sesión
        </Link>
      </div>
    </main>
  )
}
