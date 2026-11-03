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

/** Paleta de colores UV clara y consistente en modo claro y oscuro. */
export const UV_COLORS: Record<number, { bg: string; barra: string; texto: string }> = {
  1: { bg: "bg-[#8BC34A]", barra: "bg-[#8BC34A]", texto: "text-[#33691E]" }, // Bajo – verde claro
  2: { bg: "bg-[#FFEB3B]", barra: "bg-[#FFEB3B]", texto: "text-[#F57F17]" }, // Moderado – amarillo claro
  3: { bg: "bg-[#FFB74D]", barra: "bg-[#FFB74D]", texto: "text-[#E65100]" }, // Alto – naranja claro
  4: { bg: "bg-[#EF5350]", barra: "bg-[#EF5350]", texto: "text-[#B71C1C]" }, // Muy alto – rojo claro
  5: { bg: "bg-[#E57373]", barra: "bg-[#E57373]", texto: "text-[#7B1FA2]" }, // Extremo – rojo suave
};

/** Nivel UV en la escala de la OMS, con colores de escala clara. */
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
    return { nivel: 1, label: "Bajo", ...UV_COLORS[1] };
  }
  if (indice < 6) {
    return { nivel: 2, label: "Moderado", ...UV_COLORS[2] };
  }
  if (indice < 8) {
    return { nivel: 3, label: "Alto", ...UV_COLORS[3] };
  }
  if (indice < 11) {
    return { nivel: 4, label: "Muy alto", ...UV_COLORS[4] };
  }
  return { nivel: 5, label: "Extremo", ...UV_COLORS[5] };
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

export type NivelAqi = {
  label: string;
  clase: string;
  recomendacion: string;
};

/** Nivel de AQI (US) con etiqueta, color y recomendación. */
export function nivelAqiUs(indice?: number | null): NivelAqi {
  const valor =
    indice === undefined || indice === null || !Number.isFinite(indice)
      ? 0
      : indice;

  if (valor <= 0) {
    return {
      label: "Sin datos",
      clase: "bg-surface-container text-on-surface-variant",
      recomendacion: "No hay datos de calidad del aire para esta hora.",
    };
  }
  if (valor <= 50) {
    return {
      label: "Buena",
      clase: "bg-success-container text-on-success-container",
      recomendacion: "Calidad del aire satisfactoria. Actividad normal al aire libre.",
    };
  }
  if (valor <= 100) {
    return {
      label: "Moderada",
      clase: "bg-warning-container text-on-warning-container",
      recomendacion: "Aceptable. Personas sensibles podrían molestarse.",
    };
  }
  if (valor <= 150) {
    return {
      label: "Insalubre (sensibles)",
      clase: "bg-warning-container text-on-warning-container",
      recomendacion: "Grupos sensibles: limitar esfuerzo prolongado al aire libre.",
    };
  }
  if (valor <= 200) {
    return {
      label: "Insalubre",
      clase: "bg-error-container text-on-error-container",
      recomendacion: "Todos: reducir actividad prolongada al aire libre.",
    };
  }
  if (valor <= 300) {
    return {
      label: "Muy insalubre",
      clase: "bg-error-container text-on-error-container",
      recomendacion: "Evitar actividad al aire libre. Usar barbijo si salís.",
    };
  }
  return {
    label: "Peligrosa",
    clase: "bg-error text-on-error",
    recomendacion: "Emergencia de salud: quedarse en interiores.",
  };
}

/** Texto de recomendación combinado para el día. */
export function recomendacionClima({
  aqi,
  uv,
  lluvia,
  weatherCode,
  mmLluvia,
}: {
  aqi?: number | null;
  uv?: number | null;
  lluvia?: number | null;
  weatherCode?: number | null;
  mmLluvia?: number | null;
}): string {
  const partes: string[] = [];
  const nivelAqi = nivelAqiUs(aqi);
  if (aqi && aqi > 100) partes.push(nivelAqi.recomendacion);

  const esTormenta =
    weatherCode === 95 || weatherCode === 96 || weatherCode === 99;
  const esLluvia =
    (weatherCode !== null &&
      weatherCode !== undefined &&
      ((weatherCode >= 51 && weatherCode <= 67) ||
        (weatherCode >= 80 && weatherCode <= 82))) ||
    (lluvia !== null && lluvia !== undefined && lluvia >= 60);

  const mmTexto =
    mmLluvia && mmLluvia > 0
      ? ` Se esperan ${mmLluvia.toFixed(1)} mm.`
      : "";

  if (esTormenta) {
    partes.push(
      `Se esperan tormentas: mejor quedarse en interiores y evitar actividades al aire libre.${mmTexto}`,
    );
  } else if (esLluvia) {
    partes.push(`Llevá paraguas: alta probabilidad de lluvia.${mmTexto}`);
  } else if (mmLluvia && mmLluvia > 0) {
    partes.push(`Posible lluvia leve (${mmLluvia.toFixed(1)} mm).`);
  }
  if (uv && uv >= 8) {
    partes.push("Usá protector solar y evitá el sol directo entre 11 y 16 h.");
  }
  if (partes.length === 0) {
    return "Buen día para actividades al aire libre.";
  }
  return partes.join(" ");
}
