import { useEffect, useState } from "react"
import { Plus, Search } from "lucide-react"

import { CommandPalette } from "@/components/organisms/command-palette"
import { ThemeToggle } from "@/components/molecules/theme-toggle"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useQuickAdd } from "@/features/tareas/components/quick-add-provider"

export function AppTopbar() {
  const [commandOpen, setCommandOpen] = useState(false)
  const { open: openQuickAdd } = useQuickAdd()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setCommandOpen((value) => !value)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-outline-variant/50 bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <SidebarTrigger className="-ml-1" aria-label="Alternar navegación" />

      <div className="flex min-w-0 flex-1 items-center">
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          aria-label="Buscar o ir a un módulo"
          className="hidden h-9 w-full max-w-sm items-center gap-2 rounded-full border border-outline-variant/70 bg-card px-4 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted md:flex"
        >
          <Search className="size-4" aria-hidden="true" />
          <span className="flex-1">Buscar o ir a...</span>
          <kbd className="rounded-md border border-outline-variant/60 bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Buscar o ir a un módulo"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="size-4" />
        </Button>
        <ThemeToggle />
        <div className="hidden items-center gap-1.5 sm:flex">
          <Button
            type="button"
            variant="default"
            size="sm"
            className="h-9 rounded-full px-4 text-xs font-bold"
            onClick={openQuickAdd}
          >
            <Plus className="size-4" aria-hidden="true" />
            Nueva tarea
          </Button>
        </div>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </header>
  )
}
