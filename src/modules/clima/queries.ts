import "server-only";

import { cache } from "react";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { climaUbicacion } from "./schema";
import { CLIMA_TAG, UBICACION_POR_DEFECTO } from "./constantes";
import { climaDataSchema, climaResumenSchema } from "./validacion";
import { formatearCoordenadas } from "./clima-utils";
import type { ClimaData, ClimaResumen, UbicacionClima } from "./types";

const API_CLIMA = "https://api.open-meteo.com/v1/forecast";

const CAMPOS_ACTUAL = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "precipitation",
  "weather_code",
  "cloud_cover",
  "pressure_msl",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
  "uv_index",
].join(",");

const CAMPOS_HORARIOS = [
  "temperature_2m",
  "relativehumidity_2m",
  "dewpoint_2m",
  "apparent_temperature",
  "precipitation_probability",
  "precipitation",
  "pressure_msl",
  "cloudcover",
  "visibility",
  "windspeed_10m",
  "winddirection_10m",
  "windgusts_10m",
  "uv_index",
].join(",");

const CAMPOS_DIARIOS =
  "temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max";

function construirUrl(
  latitud: number,
  longitud: number,
  parametros: Record<string, string>,
) {
  const busqueda = new URLSearchParams({
    latitude: String(latitud),
    longitude: String(longitud),
    timezone: "auto",
    ...parametros,
  });

  return `${API_CLIMA}?${busqueda.toString()}`;
}

async function pedirClima(url: string) {
  const res = await fetch(url, {
    next: { revalidate: 3600, tags: [CLIMA_TAG] },
  });

  if (!res.ok) {
    throw new Error(
      `Error al obtener datos del clima: ${res.status} ${res.statusText}`,
    );
  }

  return res.json();
}

/**
 * Ubicaciones guardadas, en orden de alta.
 * Si la tabla no existe (migración pendiente) el módulo sigue funcionando.
 */
export const getUbicacionesClima = cache(async (): Promise<UbicacionClima[]> => {
  try {
    const filas = await db
      .select()
      .from(climaUbicacion)
      .orderBy(asc(climaUbicacion.id));

    return filas.map((fila) => ({
      id: fila.id,
      etiqueta:
        fila.etiqueta?.trim() ||
        formatearCoordenadas(fila.latitud, fila.longitud),
      latitud: fila.latitud,
      longitud: fila.longitud,
      esActiva: fila.esActiva,
    }));
  } catch (error) {
    console.error("No se pudieron leer las ubicaciones del clima:", error);
    return [];
  }
});

/**
 * Ubicación activa, o la de respaldo si todavía no hay ninguna guardada.
 */
export const getUbicacionClima = cache(async (): Promise<UbicacionClima> => {
  const ubicaciones = await getUbicacionesClima();
  return (
    ubicaciones.find((ubicacion) => ubicacion.esActiva) ?? UBICACION_POR_DEFECTO
  );
});

export async function getClimaData(
  ubicacion?: UbicacionClima,
): Promise<ClimaData> {
  const lugar = ubicacion ?? (await getUbicacionClima());

  const url = construirUrl(lugar.latitud, lugar.longitud, {
    daily: CAMPOS_DIARIOS,
    hourly: CAMPOS_HORARIOS,
    current: CAMPOS_ACTUAL,
    forecast_days: "16",
  });

  const data = await pedirClima(url);
  const parsed = climaDataSchema.safeParse(data);

  if (!parsed.success) {
    console.error("Respuesta inesperada de Open-Meteo:", parsed.error);
    throw new Error("La API del clima devolvió datos inesperados");
  }

  return parsed.data;
}

export async function getClimaResumen(): Promise<ClimaResumen> {
  const lugar = await getUbicacionClima();

  const url = construirUrl(lugar.latitud, lugar.longitud, {
    current: CAMPOS_ACTUAL,
    daily: "temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max",
    forecast_days: "1",
  });

  const data = await pedirClima(url);
  const parsed = climaResumenSchema.safeParse(data);

  if (!parsed.success) {
    console.error("Respuesta inesperada del resumen del clima:", parsed.error);
    throw new Error("La API del clima devolvió datos inesperados");
  }

  return {
    etiqueta: lugar.etiqueta,
    actual: parsed.data.current,
    max: parsed.data.daily.temperature_2m_max[0],
    min: parsed.data.daily.temperature_2m_min[0],
    probabilidadLluvia:
      parsed.data.daily.precipitation_probability_max[0] ?? 0,
    timezone: parsed.data.timezone,
  };
}
