import {
  Home,
  Wallet,
  CheckSquare,
  GraduationCap,
  Tv,
  CloudSun,
  HeartPulse,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export type ModuleAccent = "primary" | "secondary" | "tertiary";

export type AppModule = {
  slug: string;
  label: string;
  href: string;
  icon: LucideIcon;
  accent: ModuleAccent;
};

export const modules: AppModule[] = [
  { slug: "hub", label: "Inicio", href: "/", icon: Home, accent: "primary" },
  {
    slug: "tareas",
    label: "Tareas",
    href: "/tareas",
    icon: CheckSquare,
    accent: "primary",
  },
  {
    slug: "finanzas",
    label: "Finanzas",
    href: "/finanzas",
    icon: Wallet,
    accent: "secondary",
  },
  {
    slug: "estudio",
    label: "Estudio",
    href: "/estudio",
    icon: GraduationCap,
    accent: "tertiary",
  },
  {
    slug: "animes",
    label: "Animes",
    href: "/animes",
    icon: Tv,
    accent: "primary",
  },
  {
    slug: "clima",
    label: "Clima",
    href: "/clima",
    icon: CloudSun,
    accent: "secondary",
  },
  {
    slug: "salud",
    label: "Salud",
    href: "/salud",
    icon: HeartPulse,
    accent: "secondary",
  },
  {
    slug: "comida",
    label: "Comida",
    href: "/comida",
    icon: UtensilsCrossed,
    accent: "tertiary",
  },
];

export const accentStyles: Record<
  ModuleAccent,
  { container: string; onContainer: string; soft: string; text: string }
> = {
  primary: {
    container: "bg-lime-voltage", // Lime Voltage: el acento activo del sistema Wise (inicio / hub)
    onContainer: "text-forest-ink",
    soft: "bg-linen-mist",
    text: "text-primary",
  },
  secondary: {
    container: "bg-spruce", // Spruce: acento secundario (finanzas, clima)
    onContainer: "text-linen-mist",
    soft: "bg-linen-mist",
    text: "text-secondary",
  },
  tertiary: {
    container: "bg-forest-ink", // Forest Ink: acento terciario (estudio)
    onContainer: "text-lime-voltage",
    soft: "bg-linen-mist",
    text: "text-tertiary",
  },
};
