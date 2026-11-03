"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { TareaConDetalle } from "@/modules/tareas/queries/tareas";

export function Estadisticas({ tareas }: { tareas: TareaConDetalle[] }) {
  const porProyecto = useMemo(() => {
    const map = new Map<string, { nombre: string; total: number; completadas: number }>();
    for (const t of tareas) {
      const nombre = t.proyecto.nombre;
      const cur = map.get(nombre) ?? { nombre, total: 0, completadas: 0 };
      cur.total += 1;
      if (t.estado.categoria === "completado") cur.completadas += 1;
      map.set(nombre, cur);
    }
    return [...map.values()];
  }, [tareas]);

  const porPrioridad = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tareas) {
      const p = t.prioridad ?? "sin";
      map.set(p, (map.get(p) ?? 0) + 1);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [tareas]);

  const completadas = tareas.filter((t) => t.estado.categoria === "completado").length;
  const vencidas = tareas.filter(
    (t) =>
      t.fechaLimite &&
      t.fechaLimite < new Date().toISOString().slice(0, 10) &&
      t.estado.categoria !== "completado" &&
      t.estado.categoria !== "cancelado",
  ).length;
  const conEstimacion = tareas.filter((t) => t.estimacionMinutos);
  const tiempoEstimado = conEstimacion.reduce(
    (a, t) => a + (t.estimacionMinutos ?? 0),
    0,
  );
  const tiempoRegistrado = tareas.reduce(
    (a, t) => a + t.tiempoRegistradoSegundos,
    0,
  );

  const COLORS = ["#6750a4", "#386a52", "#8b4a2b", "#3b82f6", "#ec4899"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard titulo="Total" valor={tareas.length} />
        <StatCard titulo="Completadas" valor={completadas} />
        <StatCard titulo="Vencidas" valor={vencidas} />
        <StatCard
          titulo="Tasa de cierre"
          valor={
            tareas.length ? Math.round((completadas / tareas.length) * 100) : 0
          }
          sufijo="%"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-outline-variant/50 bg-card p-4">
          <h3 className="mb-2 text-sm font-bold text-heading">Por proyecto</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={porProyecto}>
              <XAxis dataKey="nombre" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#6750a4" name="Total" />
              <Bar dataKey="completadas" fill="#22c55e" name="Completadas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-outline-variant/50 bg-card p-4">
          <h3 className="mb-2 text-sm font-bold text-heading">Por prioridad</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={porPrioridad} dataKey="value" nameKey="name" outerRadius={80}>
                {porPrioridad.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant/50 bg-card p-4 text-sm text-charcoal">
        <p>
          Tiempo estimado total: <b>{tiempoEstimado} min</b> · Tiempo registrado:{" "}
          <b>{Math.round(tiempoRegistrado / 60)} min</b>
        </p>
      </div>
    </div>
  );
}

function StatCard({
  titulo,
  valor,
  sufijo = "",
}: {
  titulo: string;
  valor: number;
  sufijo?: string;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/50 bg-card p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-pebble">
        {titulo}
      </p>
      <p className="mt-1 text-2xl font-black text-heading">
        {valor}
        {sufijo}
      </p>
    </div>
  );
}