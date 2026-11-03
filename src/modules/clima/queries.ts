import "server-only";

import { cache } from "react";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { climaUbicacion } from "./schema";
import { CLIMA_TAG, UBICACION_POR_DEFECTO } from "./constantes";
import {
  climaDataSchema,
  climaResumenSchema,
  aireDataSchema,
} from "./validacion";
import { formatearCoordenadas } from "./clima-utils";
import type { ClimaData, ClimaResumen, UbicacionClima } from "./types";

const API_CLIMA = "https://api.open-meteo.com/v1/forecast";
const API_AIRE = "https://air-quality-api.open-meteo.com/v1/air-quality";

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

const CAMPOS_AIRE_ACTUAL = [
  "us_aqi",
  "european_aqi",
  "pm10",
  "pm2_5",
  "carbon_monoxide",
  "nitrogen_dioxide",
  "sulphur_dioxide",
  "ozone",
  "aerosol_optical_depth",
  "dust",
  "uv_index",
  "uv_index_clear_sky",
  "ammonia",
].join(",");

const CAMPOS_AIRE_HORARIOS = CAMPOS_AIRE_ACTUAL;

function construirUrl(
  base: string,
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

  return `${base}?${busqueda.toString()}`;
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

async function pedirAire(url: string) {
  const res = await fetch(url, {
    next: { revalidate: 3600, tags: [CLIMA_TAG] },
  });

  if (!res.ok) {
    throw new Error(
      `Error al obtener datos de calidad del aire: ${res.status} ${res.statusText}`,
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

function aNumero(valor: unknown): number {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : 0;
}

function obtenerAirePorTiempo(
  aire: Awaited<ReturnType<typeof aireDataSchema.parse>>,
) {
  const hourly = aire.hourly!;
  const mapa = new Map<string, typeof hourly & { index: number }>();
  hourly.time.forEach((tiempo, index) => {
    mapa.set(tiempo, { ...hourly, index });
  });
  return mapa;
}

export async function getClimaData(
  ubicacion?: UbicacionClima,
): Promise<ClimaData> {
  const lugar = ubicacion ?? (await getUbicacionClima());

  const urlClima = construirUrl(API_CLIMA, lugar.latitud, lugar.longitud, {
    daily: CAMPOS_DIARIOS,
    hourly: CAMPOS_HORARIOS,
    current: CAMPOS_ACTUAL,
    forecast_days: "16",
  });

  const urlAire = construirUrl(API_AIRE, lugar.latitud, lugar.longitud, {
    hourly: CAMPOS_AIRE_HORARIOS,
    current: CAMPOS_AIRE_ACTUAL,
    forecast_days: "7",
  });

  const [dataClima, dataAire] = await Promise.all([
    pedirClima(urlClima),
    pedirAire(urlAire),
  ]);

  const parsedClima = climaDataSchema.safeParse(dataClima);
  if (!parsedClima.success) {
    console.error("Respuesta inesperada de Open-Meteo:", parsedClima.error);
    throw new Error("La API del clima devolvió datos inesperados");
  }

  const parsedAire = aireDataSchema.safeParse(dataAire);
  const aire = parsedAire.success ? parsedAire.data : null;

  const mapaAire =
    aire && aire.hourly ? obtenerAirePorTiempo(aire!) : null;

  const hourlyMerged = parsedClima.data.hourly.time.map((timeStr, index) => {
    const aireHora = mapaAire?.get(timeStr);
    const aireIndex = aireHora?.index ?? -1;
    const campo = (nombre: string) =>
      aireIndex >= 0
        ? aNumero(
            (aire!.hourly as unknown as Record<string, number[]>)[nombre]?.[
              aireIndex
            ],
          )
        : 0;

    return {
      datePart: timeStr.split("T")[0],
      timePart: timeStr.split("T")[1]?.slice(0, 5) ?? "",
      fullTimeStr: timeStr,
      temperature: parsedClima.data.hourly.temperature_2m[index],
      humidity: parsedClima.data.hourly.relativehumidity_2m[index],
      dewpoint: parsedClima.data.hourly.dewpoint_2m[index],
      apparentTemperature: parsedClima.data.hourly.apparent_temperature[index],
      precipitationProb:
        parsedClima.data.hourly.precipitation_probability[index],
      precipitation: parsedClima.data.hourly.precipitation[index],
      pressure: parsedClima.data.hourly.pressure_msl[index],
      cloudcover: parsedClima.data.hourly.cloudcover[index],
      visibility: parsedClima.data.hourly.visibility[index],
      windSpeed: parsedClima.data.hourly.windspeed_10m[index],
      windDirection: parsedClima.data.hourly.winddirection_10m[index],
      windGusts: parsedClima.data.hourly.windgusts_10m[index],
      uvIndex: parsedClima.data.hourly.uv_index[index],
      uvClearSky: aire ? campo("uv_index_clear_sky") : 0,
      aqiUs: aire ? campo("us_aqi") : 0,
      aqiEuropeo: aire ? campo("european_aqi") : 0,
      pm25: aire ? campo("pm2_5") : 0,
      pm10: aire ? campo("pm10") : 0,
      ozono: aire ? campo("ozone") : 0,
      no2: aire ? campo("nitrogen_dioxide") : 0,
      so2: aire ? campo("sulphur_dioxide") : 0,
      co: aire ? campo("carbon_monoxide") : 0,
      polvo: aire ? campo("dust") : 0,
      aod: aire ? campo("aerosol_optical_depth") : 0,
      amoniaco: aire ? campo("ammonia") : 0,
    };
  });

  // daily derivado
  const aqiPorFecha = new Map<string, number>();
  const pm25PorFecha = new Map<string, number>();
  const uvPorFecha = new Map<string, number>();
  for (const item of hourlyMerged) {
    const fecha = item.datePart;
    aqiPorFecha.set(fecha, Math.max(aqiPorFecha.get(fecha) ?? 0, item.aqiUs));
    pm25PorFecha.set(fecha, Math.max(pm25PorFecha.get(fecha) ?? 0, item.pm25));
    uvPorFecha.set(fecha, Math.max(uvPorFecha.get(fecha) ?? 0, item.uvIndex));
  }

  const daily = parsedClima.data.daily;
  const dailyAqi = daily.time.map((fecha) => aqiPorFecha.get(fecha) ?? 0);
  const dailyPm25 = daily.time.map((fecha) => pm25PorFecha.get(fecha) ?? 0);

  const currentAire = aire?.current;
  const current: ClimaData["current"] = {
    ...parsedClima.data.current,
    uv_index_clear_sky: currentAire?.uv_index_clear_sky ?? 0,
    us_aqi: currentAire?.us_aqi ?? 0,
    european_aqi: currentAire?.european_aqi ?? 0,
    pm2_5: currentAire?.pm2_5 ?? 0,
    pm10: currentAire?.pm10 ?? 0,
    ozone: currentAire?.ozone ?? 0,
    nitrogen_dioxide: currentAire?.nitrogen_dioxide ?? 0,
    sulphur_dioxide: currentAire?.sulphur_dioxide ?? 0,
    carbon_monoxide: currentAire?.carbon_monoxide ?? 0,
    dust: currentAire?.dust ?? 0,
    aerosol_optical_depth: currentAire?.aerosol_optical_depth ?? 0,
    ammonia: currentAire?.ammonia ?? 0,
  };

  const resultado: ClimaData = {
    daily: {
      time: daily.time,
      temperature_2m_max: daily.temperature_2m_max,
      temperature_2m_min: daily.temperature_2m_min,
      weathercode: daily.weathercode,
      precipitation_probability_max: daily.precipitation_probability_max,
      aqi_us_max: dailyAqi,
      pm2_5_max: dailyPm25,
    },
    hourly: {
      time: parsedClima.data.hourly.time,
      temperature_2m: parsedClima.data.hourly.temperature_2m,
      relativehumidity_2m: parsedClima.data.hourly.relativehumidity_2m,
      dewpoint_2m: parsedClima.data.hourly.dewpoint_2m,
      apparent_temperature: parsedClima.data.hourly.apparent_temperature,
      precipitation_probability: parsedClima.data.hourly.precipitation_probability,
      precipitation: parsedClima.data.hourly.precipitation,
      pressure_msl: parsedClima.data.hourly.pressure_msl,
      cloudcover: parsedClima.data.hourly.cloudcover,
      visibility: parsedClima.data.hourly.visibility,
      windspeed_10m: parsedClima.data.hourly.windspeed_10m,
      winddirection_10m: parsedClima.data.hourly.winddirection_10m,
      windgusts_10m: parsedClima.data.hourly.windgusts_10m,
      uv_index: parsedClima.data.hourly.uv_index,
    },
    current,
    timezone: parsedClima.data.timezone,
    utc_offset_seconds: parsedClima.data.utc_offset_seconds,
    elevation: parsedClima.data.elevation,
  };

  // Nota: hourlyMerged se usa en contenido vía mapeo por tiempo; guardamos el merge en un campo auxiliar no tipado.
  (resultado as ClimaData & { hourlyMerged?: typeof hourlyMerged }).hourlyMerged =
    hourlyMerged;

  return resultado;
}

export async function getClimaResumen(): Promise<ClimaResumen> {
  const lugar = await getUbicacionClima();

  const urlClima = construirUrl(API_CLIMA, lugar.latitud, lugar.longitud, {
    current: CAMPOS_ACTUAL,
    daily:
      "temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max",
    forecast_days: "1",
  });

  const urlAire = construirUrl(API_AIRE, lugar.latitud, lugar.longitud, {
    current: CAMPOS_AIRE_ACTUAL,
    forecast_days: "1",
  });

  const [dataClima, dataAire] = await Promise.all([
    pedirClima(urlClima),
    pedirAire(urlAire),
  ]);

  const parsed = climaResumenSchema.safeParse(dataClima);
  if (!parsed.success) {
    console.error("Respuesta inesperada del resumen del clima:", parsed.error);
    throw new Error("La API del clima devolvió datos inesperados");
  }

  const parsedAire = aireDataSchema.safeParse(dataAire);
  const aireActual = parsedAire.success ? parsedAire.data.current : undefined;

  return {
    etiqueta: lugar.etiqueta,
    actual: {
      ...parsed.data.current,
      uv_index_clear_sky: aireActual?.uv_index_clear_sky ?? 0,
      us_aqi: aireActual?.us_aqi ?? 0,
      european_aqi: aireActual?.european_aqi ?? 0,
      pm2_5: aireActual?.pm2_5 ?? 0,
      pm10: aireActual?.pm10 ?? 0,
      ozone: aireActual?.ozone ?? 0,
      nitrogen_dioxide: aireActual?.nitrogen_dioxide ?? 0,
      sulphur_dioxide: aireActual?.sulphur_dioxide ?? 0,
      carbon_monoxide: aireActual?.carbon_monoxide ?? 0,
      dust: aireActual?.dust ?? 0,
      aerosol_optical_depth: aireActual?.aerosol_optical_depth ?? 0,
      ammonia: aireActual?.ammonia ?? 0,
    },
    max: parsed.data.daily.temperature_2m_max[0],
    min: parsed.data.daily.temperature_2m_min[0],
    probabilidadLluvia:
      parsed.data.daily.precipitation_probability_max[0] ?? 0,
    timezone: parsed.data.timezone,
  };
}

export type ResumenClimaDia = {
  fecha: string;
  presionMedia: number | null;
  aqiUsMax: number | null;
  uvMax: number | null;
  tempMax: number | null;
  tempMin: number | null;
};

export async function getClimaHistoricoParaSalud(
  dias = 90,
): Promise<Map<string, ResumenClimaDia>> {
  const lugar = await getUbicacionClima();

  const urlClima = construirUrl(API_CLIMA, lugar.latitud, lugar.longitud, {
    daily: CAMPOS_DIARIOS,
    hourly: CAMPOS_HORARIOS,
    current: CAMPOS_ACTUAL,
    past_days: String(dias),
    forecast_days: "1",
  });

  const urlAire = construirUrl(API_AIRE, lugar.latitud, lugar.longitud, {
    hourly: CAMPOS_AIRE_HORARIOS,
    current: CAMPOS_AIRE_ACTUAL,
    past_days: String(dias),
    forecast_days: "1",
  });

  const [dataClima, dataAire] = await Promise.all([
    pedirClima(urlClima),
    pedirAire(urlAire),
  ]);

  const parsedClima = climaDataSchema.safeParse(dataClima);
  const parsedAire = aireDataSchema.safeParse(dataAire);

  const resultado = new Map<string, ResumenClimaDia>();

  if (!parsedClima.success) {
    console.error("Histórico clima inválido:", parsedClima.error);
    return resultado;
  }

  const clima = parsedClima.data;
  const aire = parsedAire.success ? parsedAire.data : null;

  // Presión por fecha
  const presionPorFecha = new Map<string, { suma: number; count: number }>();
  const uvClimaPorFecha = new Map<string, number>();
  clima.hourly.time.forEach((tiempo, index) => {
    const fecha = tiempo.split("T")[0];
    const presion = clima.hourly.pressure_msl[index];
    const uv = clima.hourly.uv_index[index];
    const acc = presionPorFecha.get(fecha) ?? { suma: 0, count: 0 };
    acc.suma += presion;
    acc.count += 1;
    presionPorFecha.set(fecha, acc);
    uvClimaPorFecha.set(fecha, Math.max(uvClimaPorFecha.get(fecha) ?? 0, uv));
  });

  const aqiPorFecha = new Map<string, number>();
  const uvAirePorFecha = new Map<string, number>();
  const aireHourly = aire?.hourly;
  if (aireHourly) {
    aireHourly.time.forEach((tiempo, index) => {
      const fecha = tiempo.split("T")[0];
      const aqi = aNumero(aireHourly.us_aqi?.[index]);
      const uv = aNumero(aireHourly.uv_index?.[index]);
      const uvClear = aNumero(aireHourly.uv_index_clear_sky?.[index]);
      aqiPorFecha.set(fecha, Math.max(aqiPorFecha.get(fecha) ?? 0, aqi));
      uvAirePorFecha.set(
        fecha,
        Math.max(uvAirePorFecha.get(fecha) ?? 0, Math.max(uv, uvClear)),
      );
    });
  }

  clima.daily.time.forEach((fecha, index) => {
    const presion = presionPorFecha.get(fecha);
    resultado.set(fecha, {
      fecha,
      presionMedia:
        presion && presion.count > 0 ? presion.suma / presion.count : null,
      aqiUsMax: aqiPorFecha.has(fecha) ? aqiPorFecha.get(fecha)! : null,
      uvMax: Math.max(
        uvClimaPorFecha.get(fecha) ?? 0,
        uvAirePorFecha.get(fecha) ?? 0,
      ),
      tempMax: clima.daily.temperature_2m_max[index] ?? null,
      tempMin: clima.daily.temperature_2m_min[index] ?? null,
    });
  });

  return resultado;
}