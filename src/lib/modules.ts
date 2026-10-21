import {
  Home,
  Wallet,
  CheckSquare,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

export type AppModule = {
  slug: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

export const modules: AppModule[] = [
  { slug: "hub", label: "Inicio", href: "/", icon: Home },
  { slug: "tareas", label: "Tareas", href: "/tareas", icon: CheckSquare },
  { slug: "finanzas", label: "Finanzas", href: "/finanzas", icon: Wallet },
  { slug: "estudio", label: "Estudio", href: "/estudio", icon: GraduationCap },
];
