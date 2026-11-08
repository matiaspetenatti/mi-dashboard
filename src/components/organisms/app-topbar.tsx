import { useEffect, useState } from "react"
import { UserButton } from "@clerk/tanstack-react-start"
import { Link } from "@tanstack/react-router"
import { Menu, Plus, Search, Sparkles } from "lucide-react"

import { CommandPalette } from "@/components/organisms/command-palette"
import { ThemeToggle } from "@/components/molecules/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useQuickAdd } from "@/features/tareas/components/quick-add-provider"
import { modules } from "@/lib/modules"

export function AppTopbar() {
  const [open, setOpen] = useState(false)
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
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Abrir navegación"
            />
          }
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="border-b border-outline-variant/50 px-6 py-5">
            <SheetTitle className="flex items-center gap-2 text-left">
              <span className="flex size-8 items-center justify-center rounded-full bg-lime-voltage text-forest-ink">
                <Sparkles className="size-4" />
              </span>
              Mi dashboard
            </SheetTitle>
            <SheetDescription>Tu día, en orden.</SheetDescription>
          </SheetHeader>
          <nav aria-label="Navegación móvil" className="flex flex-col gap-1 p-3">
            {modules.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.slug}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  activeOptions={{ exact: item.href === "/" }}
                  className="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-heading"
                  activeProps={{
                    className:
                      "bg-primary-container text-on-primary-container hover:bg-primary-container hover:text-on-primary-container",
                  }}
                >
                  <Icon className="size-4.5" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
            <Link
              to="/ajustes"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-heading"
              activeProps={{
                className:
                  "bg-primary-container text-on-primary-container hover:bg-primary-container hover:text-on-primary-container",
              }}
            >
              Ajustes
            </Link>
          </nav>
        </SheetContent>
      </Sheet>

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
        <UserButton
          appearance={{
            elements: {
              avatarBox: "size-8",
              userButtonPopoverCard: "shadow-elevation-2",
            },
          }}
        />
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </header>
  )
}
