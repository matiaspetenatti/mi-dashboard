"use client";

import { useState } from "react";
import { ClimaData } from "./queries";
import { getWeatherInfo, formatDateLabel, windDirectionCardinal, formatVisibility, formatPressure } from "./clima-utils";
import { ClimaGraficoCombinado } from "./clima-grafico-combinado";
import { Sun, CloudSun, Cloud, CloudFog, CloudRain, Snowflake, CloudLightning, Wind, Clock, Thermometer, Droplets, Gauge, Eye, Compass, ArrowUp, ArrowDown } from "lucide-react";

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
        dewpoint: hourly.dewpoint_2m[index],
        apparentTemperature: hourly.apparent_temperature[index],
        precipitationProb: hourly.precipitation_probability[index],
        precipitation: hourly.precipitation[index],
        pressure: hourly.pressure_msl[index],
        cloudcover: hourly.cloudcover[index],
        visibility: hourly.visibility[index],
        windSpeed: hourly.windspeed_10m[index],
        windDirection: hourly.winddirection_10m[index],
        windGusts: hourly.windgusts_10m[index],
        uv_index: hourly.uv_index[index],
      };
    })
    .filter((item) => item.datePart === selectedDateStr);

  // Datos de la primera hora del día seleccionado (para el bento grid)
  const dayData = hourlyItems[0] ?? null;

  return (
    <div className="space-y-8">
      {/* Bento grid con información del día seleccionado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Temperatura (2m)",
            value: dayData?.temperature ?? "--",
            unit: "°C",
            Icon: Thermometer,
            color: "text-rose-500",
            bg: "bg-surface-container-low",
            border: "border-outline-variant/20",
            span: true,
          },
          {
            label: "Sensación térmica",
            value: dayData?.apparentTemperature ?? "--",
            unit: "°C",
            Icon: Thermometer,
            color: "text-orange-500",
            bg: "bg-orange-50/60",
            border: "border-orange-100",
            span: true,
          },
          {
            label: "Punto de rocio (2m)",
            value: dayData?.dewpoint ?? "--",
            unit: "°C",
            Icon: Droplets,
            color: "text-sky-500",
            bg: "bg-surface-container-low",
            border: "border-outline-variant/20",
          },
          {
            label: "Humedad relativa (2m)",
            value: dayData?.humidity ?? "--",
            unit: "%",
            Icon: Droplets,
            color: "text-blue-500",
            bg: "bg-surface-container-low",
            border: "border-outline-variant/20",
          },
          {
            label: "Prob. precipitación",
            value: dayData?.precipitationProb ?? "--",
            unit: "%",
            Icon: CloudRain,
            color: "text-sky-500",
            bg: "bg-surface-container-low",
            border: "border-outline-variant/20",
          },
          {
            label: "Precipitación",
            value: dayData?.precipitation ?? "--",
            unit: "mm",
            Icon: Droplets,
            color: "text-blue-500",
            bg: "bg-surface-container-low",
            border: "border-outline-variant/20",
          },
          {
            label: "Presión atmosférica",
            value: dayData?.pressure ?? "--",
            unit: "hPa",
            Icon: Gauge,
            color: "text-neutral-500",
            bg: "bg-surface-container-low",
            border: "border-outline-variant/20",
          },
          {
            label: "Cobertura de nubes",
            value: dayData?.cloudcover ?? "--",
            unit: "%",
            Icon: Cloud,
            color: "text-slate-500",
            bg: "bg-surface-container-low",
            border: "border-outline-variant/20",
          },
          {
            label: "Visibilidad",
            value: formatVisibility(dayData?.visibility ?? 0),
            unit: "",
            Icon: Eye,
            color: "text-indigo-500",
            bg: "bg-surface-container-low",
            border: "border-outline-variant/20",
          },
          {
            label: "Velocidad del viento",
            value: dayData?.windSpeed ?? "--",
            unit: "km/h",
            Icon: Wind,
            color: "text-teal-500",
            bg: "bg-surface-container-low",
            border: "border-outline-variant/20",
          },
          {
            label: "Dirección del viento",
            value: dayData?.windDirection !== undefined ? windDirectionCardinal(dayData.windDirection) : "--",
            unit: "",
            Icon: Compass,
            color: "text-purple-500",
            bg: "bg-surface-container-low",
            border: "border-outline-variant/20",
          },
          {
            label: "Ráfagas",
            value: dayData?.windGusts ?? "--",
            unit: "km/h",
            Icon: Gauge,
            color: "text-rose-500",
            bg: "bg-surface-container-low",
            border: "border-outline-variant/20",
          },
          {
            label: "Temperatura máxima",
            value: daily.temperature_2m_max[selectedDayIndex] ?? "--",
            unit: "°C",
            Icon: ArrowUp,
            color: "text-rose-500",
            bg: "bg-rose-50/60",
            border: "border-rose-100",
          },
          {
            label: "Temperatura mínima",
            value: daily.temperature_2m_min[selectedDayIndex] ?? "--",
            unit: "°C",
            Icon: ArrowDown,
            color: "text-sky-500",
            bg: "bg-sky-50/60",
            border: "border-sky-100",
          },
        ].map((card, i) => (
          <div
            key={i}
            className={`rounded-3xl p-4 shadow-sm border ${card.bg} ${card.border} ${
              card.span ? "col-span-2 sm:col-span-1 lg:col-span-2" : ""
            } flex flex-col justify-between group`}
          >
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-neutral-900">{card.value}</span>
              {card.unit && <span className="text-sm font-medium text-neutral-500">{card.unit}</span>}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <card.Icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-xs font-medium text-neutral-600 uppercase tracking-wider">
                {card.label}
              </span>
            </div>
          </div>
        ))}
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