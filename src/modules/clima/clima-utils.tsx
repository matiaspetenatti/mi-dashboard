import { Sun, CloudSun, Cloud, CloudFog, CloudRain, Snowflake, CloudLightning, SunMedium } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function getWeatherInfo(code: number): { label: string; icon: LucideIcon; color: string } {
  switch (code) {
    case 0:
      return { label: "Despejado", icon: Sun, color: "text-rose-400" };
    case 1:
    case 2:
      return { label: "Parcialmente nublado", icon: CloudSun, color: "text-peach-400" };
    case 3:
      return { label: "Nublado", icon: Cloud, color: "text-slate-300" };
    case 45:
    case 48:
      return { label: "Neblina", icon: CloudFog, color: "text-slate-400" };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
    case 80:
    case 81:
    case 82:
      return { label: "Lluvia", icon: CloudRain, color: "text-sky-300" };
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return { label: "Nieve", icon: Snowflake, color: "text-sky-200" };
    case 95:
    case 96:
    case 99:
      return { label: "Tormenta", icon: CloudLightning, color: "text-purple-300" };
    default:
      return { label: "Variable", icon: SunMedium, color: "text-rose-300" };
  }
}

export function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
  return date.toLocaleDateString('es-AR', options);
}

export function windDirectionCardinal(degrees: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
  const index = Math.round(((degrees % 360) / 360) * directions.length) % directions.length;
  return directions[index];
}

export function formatVisibility(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

export function formatPressure(hPa: number): string {
  return `${hPa} hPa`;
}