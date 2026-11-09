import { Link, useRouterState } from "@tanstack/react-router"
import { Settings, Sparkles } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
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
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  function esActivo(href: string) {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link to="/" />}
              tooltip="Inicio"
              className="rounded-full"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-lime-voltage text-forest-ink">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-col text-left group-data-[collapsible=icon]:hidden">
                <span className="truncate text-base font-black tracking-tight text-heading">
                  Mi dashboard
                </span>
                <span className="truncate text-[11px] font-medium text-muted-foreground">
                  Tu día, en orden
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Espacios
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {modules.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.slug}>
                    <SidebarMenuButton
                      render={<Link to={item.href} />}
                      isActive={esActivo(item.href)}
                      tooltip={item.label}
                      className="rounded-full"
                    >
                      <Icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/ajustes" />}
                  isActive={esActivo("/ajustes")}
                  tooltip="Ajustes"
                  className="rounded-full"
                >
                  <Settings aria-hidden="true" />
                  <span>Ajustes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60">
        <div
          className="flex items-center gap-3 rounded-2xl p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
          title={viewer.name ?? viewer.email}
        >
          <Avatar className="size-8 shrink-0">
            {viewer.imageUrl ? (
              <AvatarImage src={viewer.imageUrl} alt="" />
            ) : null}
            <AvatarFallback className="bg-linen-mist text-xs font-bold text-forest-ink dark:bg-primary-container dark:text-lime-voltage">
              {initials(viewer.name, viewer.email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-bold text-heading">
              {viewer.name ?? "Mi cuenta"}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {viewer.email}
            </p>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
