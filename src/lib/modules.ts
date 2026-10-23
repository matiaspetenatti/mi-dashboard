import {
  Home,
  Wallet,
  CheckSquare,
  GraduationCap,
  Tv,
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
];

export const accentStyles: Record<
  ModuleAccent,
  { container: string; onContainer: string; soft: string; text: string }
> = {
  primary: {
    container: "bg-primary-container",
    onContainer: "text-on-primary-container",
    soft: "bg-primary-container/45",
    text: "text-primary",
  },
  secondary: {
    container: "bg-secondary-container",
    onContainer: "text-on-secondary-container",
    soft: "bg-secondary-container/45",
    text: "text-secondary",
  },
  tertiary: {
    container: "bg-tertiary-container",
    onContainer: "text-on-tertiary-container",
    soft: "bg-tertiary-container/45",
    text: "text-tertiary",
  },
};
