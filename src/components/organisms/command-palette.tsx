"use client"

import { useNavigate } from "@tanstack/react-router"
import { Plus, Settings } from "lucide-react"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useQuickAdd } from "@/features/tareas/components/quick-add-provider"
import { modules, type AppModuleHref } from "@/lib/modules"

type Destino = AppModuleHref | "/ajustes"

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const { open: openQuickAdd } = useQuickAdd()

  const irA = (href: Destino) => {
    onOpenChange(false)
    void navigate({ to: href })
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Buscar en Mi Dashboard"
      description="Buscá un módulo o una acción"
      className="sm:max-w-lg"
    >
      <Command>
        <CommandInput placeholder="Buscar o ir a..." />
        <CommandList>
          <CommandEmpty>No encontramos nada.</CommandEmpty>

          <CommandGroup heading="Ir a">
            {modules.map((item) => {
              const Icon = item.icon
              return (
                <CommandItem
                  key={item.slug}
                  value={`${item.label} ${item.description}`}
                  onSelect={() => irA(item.href)}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {item.description}
                  </span>
                </CommandItem>
              )
            })}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Acciones">
            <CommandItem
              value="Nueva tarea crear"
              onSelect={() => {
                onOpenChange(false)
                openQuickAdd()
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Nueva tarea
            </CommandItem>
            <CommandItem value="Ajustes preferencias" onSelect={() => irA("/ajustes")}>
              <Settings className="size-4" aria-hidden="true" />
              Ajustes
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
