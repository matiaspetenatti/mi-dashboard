import { z } from "zod";

const serie = z.array(z.number());

const actualSchema = z.object({
  time: z.string(),
  temperature_2m: z.number(),
  relative_humidity_2m: z.number(),
  apparent_temperature: z.number(),
  precipitation: z.number(),
  weather_code: z.number(),
  cloud_cover: z.number(),
  pressure_msl: z.number(),
  wind_speed_10m: z.number(),
  wind_direction_10m: z.number(),
  wind_gusts_10m: z.number(),
  uv_index: z.number(),
});

export const climaDataSchema = z.object({
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_max: serie,
    temperature_2m_min: serie,
    weathercode: serie,
    precipitation_probability_max: serie,
  }),
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: serie,
    relativehumidity_2m: serie,
    dewpoint_2m: serie,
    apparent_temperature: serie,
    precipitation_probability: serie,
    precipitation: serie,
    pressure_msl: serie,
    cloudcover: serie,
    visibility: serie,
    windspeed_10m: serie,
    winddirection_10m: serie,
    windgusts_10m: serie,
    uv_index: serie,
  }),
  current: actualSchema,
  timezone: z.string(),
  utc_offset_seconds: z.number(),
  elevation: z.number(),
});

export const climaResumenSchema = z.object({
  current: actualSchema,
  daily: z.object({
    temperature_2m_max: z.array(z.number()).min(1),
    temperature_2m_min: z.array(z.number()).min(1),
    weathercode: z.array(z.number()).min(1),
    precipitation_probability_max: z.array(z.number()).min(1),
  }),
  timezone: z.string(),
});
