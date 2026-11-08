import {
  Activity,
  CheckSquare,
  CloudSun,
  GraduationCap,
  HeartPulse,
  Home,
  Tv,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react"

export type AppModuleHref =
  | "/"
  | "/tareas"
  | "/finanzas"
  | "/estudio"
  | "/animes"
  | "/clima"
  | "/salud"
  | "/comida"
  | "/habitos"

export type AppModule = {
  slug: string
  label: string
  href: AppModuleHref
  icon: LucideIcon
  description: string
  accent: "primary" | "secondary" | "tertiary"
}

export const modules: Array<AppModule> = [
  {
    slug: "inicio",
    label: "Inicio",
    href: "/",
    icon: Home,
    description: "Tu día, en orden",
    accent: "primary",
  },
  {
    slug: "tareas",
    label: "Tareas",
    href: "/tareas",
    icon: CheckSquare,
    description: "Proyectos y pendientes",
    accent: "primary",
  },
  {
    slug: "finanzas",
    label: "Finanzas",
    href: "/finanzas",
    icon: Wallet,
    description: "Cuentas, movimientos y patrimonio",
    accent: "secondary",
  },
  {
    slug: "estudio",
    label: "Estudio",
    href: "/estudio",
    icon: GraduationCap,
    description: "Carrera, materias y exámenes",
    accent: "tertiary",
  },
  {
    slug: "animes",
    label: "Animes",
    href: "/animes",
    icon: Tv,
    description: "Catálogo, puntajes y emisión",
    accent: "primary",
  },
  {
    slug: "clima",
    label: "Clima",
    href: "/clima",
    icon: CloudSun,
    description: "Actual y pronóstico extendido",
    accent: "secondary",
  },
  {
    slug: "salud",
    label: "Salud",
    href: "/salud",
    icon: HeartPulse,
    description: "Migraña y bienestar",
    accent: "secondary",
  },
  {
    slug: "comida",
    label: "Comida",
    href: "/comida",
    icon: UtensilsCrossed,
    description: "Despensa, recetas y compras",
    accent: "tertiary",
  },
  {
    slug: "habitos",
    label: "Hábitos",
    href: "/habitos",
    icon: Activity,
    description: "Rachas y seguimiento diario",
    accent: "secondary",
  },
]
