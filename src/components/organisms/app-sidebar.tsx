import { Link } from "@tanstack/react-router"
import { ChevronDown, Settings, Sparkles } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { modules } from "@/lib/modules"

export type SidebarViewer = {
  name: string | null
  email: string
  imageUrl: string | null
}

function initials(name: string | null, email: string) {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

export function AppSidebar({ viewer }: { viewer: SidebarViewer }) {
  return (
    <aside className="hidden w-[260px] shrink-0 flex-col border-r border-outline-variant/60 bg-sidebar/80 backdrop-blur-xl lg:flex">
      <div className="flex flex-col gap-1 px-6 pt-6 pb-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-lime-voltage text-forest-ink">
            <Sparkles className="size-4.5" aria-hidden="true" />
          </span>
          <span className="flex flex-col">
            <span className="text-base font-black tracking-tight text-heading">
              Mi dashboard
            </span>
            <span className="text-[11px] font-medium text-muted-foreground">
              Tu día, en orden
            </span>
          </span>
        </Link>
      </div>

      <div className="px-4 pb-4">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-full border border-outline-variant/70 bg-card px-4 py-2 text-left text-xs font-semibold text-heading transition-colors hover:bg-muted"
        >
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-lime-voltage" />
            Personal
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      <nav aria-label="Navegación principal" className="flex-1 overflow-y-auto px-3">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Espacios
        </p>
        <ul className="flex flex-col gap-0.5">
          {modules.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.slug}>
                <Link
                  to={item.href}
                  activeOptions={{ exact: item.href === "/" }}
                  className="group flex items-center gap-3 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-surface-container hover:text-heading"
                  activeProps={{
                    className:
                      "bg-primary-container text-on-primary-container shadow-[inset_0_0_0_1px_rgba(22,51,0,0.08)] hover:bg-primary-container hover:text-on-primary-container",
                  }}
                >
                  <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="my-4 h-px bg-outline-variant/40" />

        <Link
          to="/ajustes"
          className="flex items-center gap-3 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-surface-container hover:text-heading"
          activeProps={{
            className:
              "bg-primary-container text-on-primary-container hover:bg-primary-container hover:text-on-primary-container",
          }}
        >
          <Settings className="size-4.5 shrink-0" aria-hidden="true" />
          Ajustes
        </Link>
      </nav>

      <div className="border-t border-outline-variant/40 p-3">
        <div className="flex items-center gap-3 rounded-2xl p-2">
          <Avatar className="size-9">
            {viewer.imageUrl ? (
              <AvatarImage src={viewer.imageUrl} alt="" />
            ) : null}
            <AvatarFallback className="bg-linen-mist text-xs font-bold text-forest-ink dark:bg-primary-container dark:text-lime-voltage">
              {initials(viewer.name, viewer.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-heading">
              {viewer.name ?? "Mi cuenta"}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {viewer.email}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
