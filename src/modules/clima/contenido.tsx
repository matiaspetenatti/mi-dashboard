"use client";

import { useState } from "react";
import { ClimaData } from "./queries";
import { getWeatherInfo, formatDateLabel } from "./clima-utils";
import { ClimaGraficoCombinado } from "./clima-grafico-combinado";
import { Sun, CloudSun, Cloud, CloudFog, CloudRain, Snowflake, CloudLightning, Wind, SunMedium, Calendar, Clock } from "lucide-react";

export function ClimaContenido({ data }: { data: ClimaData }) {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  const { daily, hourly } = data;

  // Selected date string (YYYY-MM-DD)
  const selectedDateStr = daily.time[selectedDayIndex];
  const selectedWeather = getWeatherInfo(daily.weathercode[selectedDayIndex]);

  // Filter hourly data for the selected day
  const hourlyItems = hourly.time
    .map((timeStr, index) => {
      const [datePart, timePart] = timeStr.split("T");
      return {
        datePart,
        timePart,
        fullTimeStr: timeStr,
        temperature: hourly.temperature_2m[index],
        humidity: hourly.relativehumidity_2m[index],
        apparentTemperature: hourly.apparent_temperature[index],
        precipitationProb: hourly.precipitation_probability[index],
        windSpeed: hourly.windspeed_10m[index],
        uv_index: hourly.uv_index[index],
      };
    })
    .filter((item) => item.datePart === selectedDateStr);

  // Find current temperature if selectedDayIndex is 0 (Today)
  let currentTemp: number | null = null;
  if (selectedDayIndex === 0) {
    const now = new Date();
    // Format current hour as YYYY-MM-DDTHH:00 to match Open-Meteo hourly format
    const currentHourStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:00`;
    const currentHourItem = hourly.time.findIndex(t => t.startsWith(currentHourStr.slice(0, 13)));
    if (currentHourItem !== -1) {
      currentTemp = hourly.temperature_2m[currentHourItem];
    } else if (hourlyItems.length > 0) {
      // Fallback to the closest hourly item if exact match not found
      currentTemp = hourlyItems[0].temperature;
    }
  }

  return (
    <div className="space-y-8">
      {/* Current/Selected Day Highlight Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-50/30 via-peach-50/30 to-surface-container-high/70 p-6 md:p-8 border border-outline-variant/30 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-surface/60 px-3 py-1 text-xs font-medium text-neutral-600 border border-outline-variant/20 shadow-sm">
              <Calendar className="h-3.5 w-3.5 text-rose-300" />
              <span>{formatDateLabel(selectedDateStr)}</span>
              {selectedDayIndex === 0 && <span className="text-rose-300 font-bold">(Hoy)</span>}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 flex items-baseline gap-3 flex-wrap">
              {selectedDayIndex === 0 && currentTemp !== null ? (
                <span className="text-rose-300">
                  {currentTemp}°C <span className="text-xs font-normal uppercase text-neutral-500 bg-surface/60 px-2 py-0.5 rounded-full border border-outline-variant/20 inline-block align-middle">Actual</span>
                </span>
              ) : null}
              <span>
                Máx: {daily.temperature_2m_max[selectedDayIndex]}°C{" "}
                <span className="text-xl md:text-2xl font-normal text-neutral-500">
                  / Mín: {daily.temperature_2m_min[selectedDayIndex]}°C
                </span>
              </span>
            </h2>
            <div className="flex items-center gap-2 text-neutral-700 font-medium">
              {(() => { const WeatherIcon = selectedWeather.icon; return <WeatherIcon className={`h-5 w-5 ${selectedWeather.color}`} />; })()}
              <span>{selectedWeather.label}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface/60 backdrop-blur-md p-4 rounded-2xl border border-outline-variant/20 shadow-inner">
            <div className="space-y-1">
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                <CloudRain className="h-3.5 w-3.5 text-sky-300" /> Humedad prom
              </span>
              <p className="text-sm font-semibold text-neutral-800">
                {hourlyItems.length > 0 
                  ? Math.round(hourlyItems.reduce((acc, curr) => acc + curr.humidity, 0) / hourlyItems.length) 
                  : 0}%
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                <CloudRain className="h-3.5 w-3.5 text-sky-300" /> Lluvia máx
              </span>
              <p className="text-sm font-semibold text-neutral-800">
                {hourlyItems.length > 0 ? Math.max(...hourlyItems.map(i => i.precipitationProb)) : 0}%
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                <Wind className="h-3.5 w-3.5 text-teal-400" /> Viento máx
              </span>
              <p className="text-sm font-semibold text-neutral-800">
                {hourlyItems.length > 0 ? Math.max(...hourlyItems.map(i => i.windSpeed)) : 0} km/h
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                <SunMedium className="h-3.5 w-3.5 text-peach-300" /> UV máx
              </span>
              <p className="text-sm font-semibold text-neutral-800">
                {hourlyItems.length > 0 ? Math.max(...hourlyItems.map(i => i.uv_index)) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Recharts Graph for 16 Days */}
      <ClimaGraficoCombinado 
        data={data} 
        selectedIndex={selectedDayIndex} 
        onSelectDay={setSelectedDayIndex} 
      />

      {/* 16 Days Selection Grid */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold tracking-tight text-neutral-900">
          Seleccionar día (16 días de pronóstico)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 max-h-[320px] overflow-y-auto pr-1">
          {daily.time.map((dateStr, index) => {
            const weather = getWeatherInfo(daily.weathercode[index]);
            const DayIcon = weather.icon;
            const isSelected = selectedDayIndex === index;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDayIndex(index)}
                className={`flex flex-col items-center justify-between p-2 rounded-2xl border transition-all text-left ${
                  isSelected
                    ? "bg-gradient-to-br from-rose-100 to-peach-100 text-rose-600 border-rose-200 shadow-md hover:scale-[1.02]"
                    : "bg-surface-container-low hover:bg-surface/50 border-outline-variant/30 text-neutral-700 hover:text-neutral-900 transition-colors"
                }`}
              >
                <div className="w-full flex justify-between items-center text-xs">
                  <span className={`font-medium ${isSelected ? "text-rose-600/90" : "text-neutral-500"}`}>
                    {index === 0 ? "Hoy" : formatDateLabel(dateStr).split(",")[0]}
                  </span>
                  <span className={`text-[10px] ${isSelected ? "text-rose-600/80" : "text-neutral-400"}`}>
                    {dateStr.split("-").slice(1).join("/")}
                  </span>
                </div>

                <div className="my-2">
                  <DayIcon className={`h-6 w-6 ${isSelected ? "text-rose-600" : weather.color}`} />
                </div>

                <div className="w-full text-center space-y-0.5">
                  <div className={`text-sm font-bold ${isSelected ? "text-rose-600" : "text-neutral-900"}`}>
                    {daily.temperature_2m_max[index]}°
                  </div>
                  <div className={`text-xs ${isSelected ? "text-rose-600/80" : "text-neutral-500"}`}>
                    {daily.temperature_2m_min[index]}°
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hourly Breakdown for Selected Day */}
      <div className="space-y-4 pt-4 border-t border-outline-variant/30">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-rose-300" />
          <h3 className="text-xl font-bold tracking-tight text-neutral-900">
            Desagregado por horas ({formatDateLabel(selectedDateStr)})
          </h3>
        </div>

        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Hora</th>
                  <th className="py-3 px-4">Temp</th>
                  <th className="py-3 px-4">Sensación</th>
                  <th className="py-3 px-4">Lluvia</th>
                  <th className="py-3 px-4">Viento</th>
                  <th className="py-3 px-4">Humedad</th>
                  <th className="py-3 px-4">Índice UV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-sm">
                {hourlyItems.map((item) => (
                  <tr key={item.timePart} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-neutral-900 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-neutral-400" />
                      {item.timePart} hs
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-900">
                      {item.temperature}°C
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {item.apparentTemperature}°C
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.precipitationProb > 30 ? "bg-sky-100 text-sky-700" : "bg-surface/80 text-neutral-600"
                      }`}>
                        <CloudRain className="h-3 w-3" />
                        {item.precipitationProb}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {item.windSpeed} km/h
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {item.humidity}%
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${
                        item.uv_index >= 8 ? "bg-rose-100 text-rose-600" :
                        item.uv_index >= 6 ? "bg-peach-100 text-peach-600" :
                        item.uv_index >= 3 ? "bg-peach-100 text-peach-600" : "bg-sky-100 text-sky-600"
                      }`}>
                        {item.uv_index}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ClimaSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-48 rounded-3xl bg-surface-container-high" />
      <div className="h-96 rounded-3xl bg-surface-container-high" />
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-surface-container-high" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-surface-container-high" />
    </div>
  );
}