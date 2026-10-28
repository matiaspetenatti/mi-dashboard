import { Sun, CloudSun, Cloud, CloudFog, CloudRain, Snowflake, CloudLightning, SunMedium } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function getWeatherInfo(code: number): { label: string; icon: LucideIcon; color: string } {
  switch (code) {
    case 0:
      return { label: "Despejado", icon: Sun, color: "text-warning" };
    case 1:
    case 2:
      return { label: "Parcialmente nublado", icon: CloudSun, color: "text-tertiary" };
    case 3:
      return { label: "Nublado", icon: Cloud, color: "text-on-surface-variant" };
    case 45:
    case 48:
      return { label: "Neblina", icon: CloudFog, color: "text-outline" };
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
      return { label: "Lluvia", icon: CloudRain, color: "text-primary" };
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return { label: "Nieve", icon: Snowflake, color: "text-chart-4" };
    case 95:
    case 96:
    case 99:
      return { label: "Tormenta", icon: CloudLightning, color: "text-error" };
    default:
      return { label: "Variable", icon: SunMedium, color: "text-warning" };
  }
}

export function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
  return date.toLocaleDateString('es-AR', options);
}

/** Etiqueta compacta para el eje del gráfico: "mié 28". */
export function formatDiaCorto(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const partes = new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
  }).formatToParts(date);
  const dia = partes.find((parte) => parte.type === "weekday")?.value ?? "";
  const numero = partes.find((parte) => parte.type === "day")?.value ?? "";
  return `${dia} ${numero}`.trim();
}

export function windDirectionCardinal(degrees?: number | null): string {
  if (degrees === undefined || degrees === null || !Number.isFinite(degrees)) {
    return "--";
  }

  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
  const index = Math.round(((degrees % 360) / 360) * directions.length) % directions.length;
  return directions[index];
}

export function formatVisibility(meters?: number | null): string {
  if (meters === undefined || meters === null || !Number.isFinite(meters) || meters <= 0) {
    return "--";
  }

  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

export type NivelUv = {
  nivel: number;
  label: string;
  barra: string;
  texto: string;
};

/** Nivel UV en la escala de la OMS, con clases del tema para el medidor. */
export function nivelUv(indice?: number | null): NivelUv {
  if (indice === undefined || indice === null || !Number.isFinite(indice) || indice < 0) {
    return {
      nivel: 0,
      label: "Sin datos",
      barra: "bg-surface-container-high",
      texto: "text-on-surface-variant",
    };
  }

  if (indice < 3) {
    return { nivel: 1, label: "Bajo", barra: "bg-success", texto: "text-success" };
  }
  if (indice < 6) {
    return { nivel: 2, label: "Moderado", barra: "bg-warning", texto: "text-warning" };
  }
  if (indice < 8) {
    return { nivel: 3, label: "Alto", barra: "bg-tertiary", texto: "text-tertiary" };
  }
  if (indice < 11) {
    return { nivel: 4, label: "Muy alto", barra: "bg-error", texto: "text-error" };
  }
  return { nivel: 5, label: "Extremo", barra: "bg-error", texto: "text-error" };
}

/**
 * Rotación para una flecha que muestra hacia dónde va el viento.
 * La dirección meteorológica indica desde dónde sopla, por eso sumamos 180°.
 */
export function rotacionViento(grados?: number | null): number {
  if (grados === undefined || grados === null || !Number.isFinite(grados)) {
    return 0;
  }
  return (grados + 180) % 360;
}

/** Posición (0–100) de un valor dentro de un rango, para el marcador del héroe. */
export function posicionEnRango(
  valor?: number | null,
  minimo?: number | null,
  maximo?: number | null,
): number {
  if (
    valor === undefined ||
    valor === null ||
    minimo === undefined ||
    minimo === null ||
    maximo === undefined ||
    maximo === null ||
    !Number.isFinite(valor) ||
    !Number.isFinite(minimo) ||
    !Number.isFinite(maximo) ||
    maximo <= minimo
  ) {
    return 50;
  }

  return Math.min(100, Math.max(0, ((valor - minimo) / (maximo - minimo)) * 100));
}

export function formatearCoordenadas(latitud: number, longitud: number): string {
  return `${latitud.toFixed(4)}, ${longitud.toFixed(4)}`;
}
