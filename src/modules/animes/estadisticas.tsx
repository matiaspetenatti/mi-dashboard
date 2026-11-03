"use client";

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
  ScatterChart,
  Scatter,
  CartesianGrid,
  Legend,
} from "recharts";

const COLORES = [
  "#163300",
  "#9fe870",
  "#054d28",
  "#454745",
  "#868685",
  "#0b4c72",
  "#cb272f",
];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-outline-variant/40 bg-card p-4 shadow-elevation-1">
      <h3 className="mb-3 text-sm font-semibold text-charcoal">{title}</h3>
      {children}
    </div>
  );
}

export function AnimesEstadisticas(props: {
  porEstado: { estado: string; total: number }[];
  porAno: { ano: number; total: number }[];
  porGenero: { genero: string; total: number }[];
  porEstudio: { valor: string; total: number }[];
  porFuente: { valor: string; total: number }[];
  porFormato: { valor: string; total: number }[];
  promedios: { genero: string; promedio: number; total: number }[];
  top: { id: number; titulo: string; miPuntaje: number | null; scoreMal: number | null }[];
  comparativa: { titulo: string; miPuntaje: number; scoreMal: number }[];
  horas: { episodios: number; horas: number };
  mejor: { genero: string; promedio: number; total: number } | null;
}) {
  const {
    porEstado,
    porAno,
    porGenero,
    porEstudio,
    porFuente,
    porFormato,
    promedios,
    top,
    comparativa,
    horas,
    mejor,
  } = props;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card title="Horas estimadas">
          <p className="text-2xl font-bold tabular-nums text-charcoal">
            {horas.horas}
          </p>
          <p className="text-xs text-pebble">{horas.episodios} episodios vistos</p>
        </Card>
        <Card title="Mejor género">
          <p className="truncate text-lg font-bold text-charcoal">
            {mejor ? mejor.genero : "—"}
          </p>
          <p className="text-xs text-pebble">
            {mejor ? `Promedio ${mejor.promedio} (${mejor.total} animes)` : "Sin datos"}
          </p>
        </Card>
        <Card title="Total de animes">
          <p className="text-2xl font-bold tabular-nums text-charcoal">
            {porEstado.reduce((a, b) => a + b.total, 0)}
          </p>
        </Card>
        <Card title="Géneros distintos">
          <p className="text-2xl font-bold tabular-nums text-charcoal">
            {porGenero.length}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Por estado">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={porEstado}
                dataKey="total"
                nameKey="estado"
                outerRadius={80}
                label
              >
                {porEstado.map((_, i) => (
                  <Cell key={i} fill={COLORES[i % COLORES.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Por año de emisión">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={porAno}>
              <XAxis dataKey="ano" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill="#163300" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Top géneros">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={porGenero.slice(0, 10)} layout="vertical">
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="genero" width={90} />
              <Tooltip />
              <Bar dataKey="total" fill="#9fe870" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Promedio de puntaje por género">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={promedios.slice(0, 10)} layout="vertical">
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="genero" width={90} />
              <Tooltip />
              <Bar dataKey="promedio" fill="#054d28" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Por estudio">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={porEstudio.slice(0, 10)} layout="vertical">
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="valor" width={110} />
              <Tooltip />
              <Bar dataKey="total" fill="#454745" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Por fuente">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={porFuente}
                dataKey="total"
                nameKey="valor"
                outerRadius={80}
                label
              >
                {porFuente.map((_, i) => (
                  <Cell key={i} fill={COLORES[i % COLORES.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Por formato">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={porFormato}>
              <XAxis dataKey="valor" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill="#0b4c72" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Score propio vs score MAL (×10)">
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid />
            <XAxis dataKey="scoreMal" name="MAL" domain={[0, 100]} />
            <YAxis dataKey="miPuntaje" name="Mío" domain={[0, 100]} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={comparativa} fill="#163300" />
          </ScatterChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Top 10 por puntaje">
        <ol className="space-y-1">
          {top.map((a, idx) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-surface-container"
            >
              <span className="w-5 text-xs font-bold tabular-nums text-pebble">
                {idx + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-charcoal">
                {a.titulo}
              </span>
              <span className="text-sm font-semibold tabular-nums text-charcoal">
                {a.miPuntaje ?? "—"}
              </span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}