import { SignIn } from "@clerk/tanstack-react-start"
import { createFileRoute } from "@tanstack/react-router"
import { Sparkles } from "lucide-react"

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
})

function SignInPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-lime-voltage text-forest-ink">
          <Sparkles className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h1 className="text-display text-4xl text-heading">Mi Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Tu espacio personal, en orden.
          </p>
        </div>
      </div>

      <SignIn routing="hash" withSignUp={false} />
    </main>
  )
}
