export type ClimaHora = {
  datePart: string;
  timePart: string;
  fullTimeStr: string;
  temperature: number;
  humidity: number;
  dewpoint: number;
  apparentTemperature: number;
  precipitationProb: number;
  precipitation: number;
  pressure: number;
  cloudcover: number;
  visibility: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  uvIndex: number;
};

export type ClimaActual = {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  precipitation: number;
  weather_code: number;
  cloud_cover: number;
  pressure_msl: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  uv_index: number;
};

export type ClimaData = {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
    precipitation_probability_max: number[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relativehumidity_2m: number[];
    dewpoint_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    pressure_msl: number[];
    cloudcover: number[];
    visibility: number[];
    windspeed_10m: number[];
    winddirection_10m: number[];
    windgusts_10m: number[];
    uv_index: number[];
  };
  current: ClimaActual;
  timezone: string;
  utc_offset_seconds: number;
  elevation: number;
};

export type ClimaResumen = {
  etiqueta: string;
  actual: ClimaActual;
  max: number;
  min: number;
  probabilidadLluvia: number;
  timezone: string;
};

export type UbicacionClima = {
  id: number | null;
  etiqueta: string;
  latitud: number;
  longitud: number;
  esActiva: boolean;
};
