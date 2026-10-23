import {
  Tag,
  UtensilsCrossed,
  Car,
  Bus,
  Zap,
  Droplet,
  Flame,
  Wifi,
  Phone,
  HeartPulse,
  GraduationCap,
  Briefcase,
  TrendingUp,
  ArrowRightLeft,
  Wrench,
  ShoppingBag,
  Gamepad2,
  Gift,
  Home,
  Building2,
  Receipt,
  Coins,
  Landmark,
  Banknote,
  ShoppingCart,
  Pill,
  BookOpen,
  Music,
  Film,
  Plane,
  Fuel,
  Hammer,
  Lightbulb,
  Cable,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

export const ICONOS_CATEGORIAS_MAP: Record<string, LucideIcon> = {
  Tag,
  UtensilsCrossed,
  Car,
  Bus,
  Zap,
  Droplet,
  Flame,
  Wifi,
  Phone,
  HeartPulse,
  GraduationCap,
  Briefcase,
  TrendingUp,
  ArrowRightLeft,
  Wrench,
  ShoppingBag,
  Gamepad2,
  Gift,
  Home,
  Building2,
  Receipt,
  Coins,
  Landmark,
  Banknote,
  ShoppingCart,
  Pill,
  BookOpen,
  Music,
  Film,
  Plane,
  Fuel,
  Hammer,
  Lightbulb,
  Cable,
  Smartphone,
};

export const ICONOS_CATEGORIAS_LISTA = Object.keys(ICONOS_CATEGORIAS_MAP);

export function getIconoCategoria(icono?: string | null): LucideIcon {
  if (!icono) return Tag;
  return ICONOS_CATEGORIAS_MAP[icono] ?? Tag;
}

export function CategoriaIcon({ icono, size = 16, className }: { icono?: string | null; size?: number; className?: string }) {
  const Icon = getIconoCategoria(icono);
  return <Icon size={size} className={className} />;
}
