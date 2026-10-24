"use client";

import { 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { ClimaData } from "./queries";
import { formatDateLabel, getWeatherInfo } from "./clima-utils";

export function ClimaGraficoCombinado({ 
  data, 
  selectedIndex, 
  onSelectDay 
}: { 
  data: ClimaData; 
  selectedIndex: number; 
  onSelectDay: (index: number) => void; 
}) {
  const { daily } = data;

  // Format data for Recharts
  const chartData = daily.time.map((dateStr, index) => {
    const weather = getWeatherInfo(daily.weathercode[index]);
    const maxTemp = daily.temperature_2m_max[index];
    const minTemp = daily.temperature_2m_min[index];
    const precipitation = daily.precipitation_probability_max 
      ? daily.precipitation_probability_max[index] 
      : 0;

    return {
      index,
      dateStr,
      label: formatDateLabel(dateStr),
      shortLabel: index === 0 ? "Hoy" : formatDateLabel(dateStr).split(",")[0],
      maxTemp,
      minTemp,
      precipitation,
      weatherLabel: weather.label,
    };
  });

  // Calculate strict min/max for temperature domain so Recharts doesn't miscalculate
  const allMaxTemps = daily.temperature_2m_max;
  const allMinTemps = daily.temperature_2m_min;
  const lowestTemp = Math.min(...allMinTemps);
  const highestTemp = Math.max(...allMaxTemps);
  // Add a small padding
  const tempDomain = [Math.floor(lowestTemp - 3), Math.ceil(highestTemp + 3)];

  return (
    <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-low p-6 shadow-sm space-y-4" style={{ minHeight: '350px' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-neutral-900">
            Evolución de Temperaturas y Lluvia (16 Días)
          </h3>
          <p className="text-xs text-neutral-500">
            Hacé clic en cualquier día del gráfico o usa las tarjetas inferiores para ver el detalle por hora
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-neutral-600">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-300 inline-block" /> Máxima (°C)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-sky-300 inline-block" /> Mínima (°C)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-sky-100 inline-block" /> Prob. Lluvia (%)
          </div>
        </div>
      </div>

      <div className="h-[350px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload.length > 0) {
                const clickedIndex = e.activePayload[0].payload.index;
                onSelectDay(clickedIndex);
              }
            }}
            margin={{ top: 10, right: 30, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2d6f0" vertical={false} />
            <XAxis 
              dataKey="shortLabel" 
              stroke="#a095c2" 
              fontSize={12} 
              tickLine={false} 
              axisLine={{ stroke: "#e2d6f0" }}
            />
            <YAxis 
              yAxisId="temp" 
              stroke="#a095c2" 
              fontSize={12} 
              domain={tempDomain} 
              tickLine={false}
              axisLine={false}
              unit="°C"
            />
            <YAxis 
              yAxisId="rain" 
              orientation="right" 
              stroke="#a095c2" 
              fontSize={12} 
              domain={[0, 100]} 
              tickLine={false}
              axisLine={false}
              unit="%"
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-outline-variant/30 bg-surface/95 backdrop-blur-md p-3 shadow-lg text-xs space-y-1">
                      <p className="font-bold text-neutral-900 border-b pb-1 mb-1">
                        {data.label} {data.index === 0 ? "(Hoy)" : ""}
                      </p>
                      <p className="text-rose-500 font-medium">
                        Temp Máx: <strong>{data.maxTemp}°C</strong>
                      </p>
                      <p className="text-sky-400 font-medium">
                        Temp Mín: <strong>{data.minTemp}°C</strong>
                      </p>
                      <p className="text-sky-400 font-medium">
                        Prob. Lluvia: <strong>{data.precipitation}%</strong>
                      </p>
                      <p className="text-neutral-500 italic pt-0.5">
                        {data.weatherLabel}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              yAxisId="rain" 
              dataKey="precipitation" 
              name="Prob. Lluvia" 
              fill="#bae6fd" 
              radius={[4, 4, 0, 0]} 
              opacity={0.6}
            />
            <Line 
              yAxisId="temp" 
              type="monotone" 
              dataKey="maxTemp" 
              name="Máxima" 
              stroke="#f472b6" 
              strokeWidth={3} 
              dot={{ r: 4, fill: "#f472b6", cursor: "pointer" }} 
              activeDot={{ r: 7, stroke: "#fff", strokeWidth: 2, cursor: "pointer" }}
            />
            <Line 
              yAxisId="temp" 
              type="monotone" 
              dataKey="minTemp" 
              name="Mínima" 
              stroke="#67e2f9" 
              strokeWidth={3} 
              dot={{ r: 4, fill: "#67e2f9", cursor: "pointer" }} 
              activeDot={{ r: 7, stroke: "#fff", strokeWidth: 2, cursor: "pointer" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-2 pt-2 border-t border-outline-variant/20">
        <span className="text-xs text-neutral-500">Día seleccionado actualmente:</span>
        <span className="text-xs font-bold text-rose-400 bg-rose-100 px-2.5 py-1 rounded-full">
          {formatDateLabel(daily.time[selectedIndex])} {selectedIndex === 0 ? "(Hoy)" : ""}
        </span>
      </div>
    </div>
  );
}