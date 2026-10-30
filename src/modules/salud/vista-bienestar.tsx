import { Activity, Droplets, Monitor, Moon } from "lucide-react";
import { CorrelacionHabitos } from "./components/correlacion-habitos";
import { DiarioBienestar } from "./components/diario-bienestar";
import type { ResumenSalud } from "./queries";
import type { RegistroDiarioSalud } from "./schema";

function promedioDe(
  registros: RegistroDiarioSalud[],
  clave: keyof RegistroDiarioSalud,
) {
  const valores = registros
    .map((registro) => registro[clave])
    .filter((valor): valor is number => typeof valor === "number");

  if (valores.length === 0) return null;
  return (
    Math.round(
      (valores.reduce((total, valor) => total + valor, 0) / valores.length) * 10,
    ) / 10
  );
}

export function VistaBienestar({ data }: { data: ResumenSalud }) {
  const ultimosSiete = data.diario.slice(0, 7);

  const metricas = [
    {
      icono: Moon,
      etiqueta: "Sueño promedio",
      valor: promedioDe(ultimosSiete, "horasSueno"),
      unidad: "h",
    },
    {
      icono: Droplets,
      etiqueta: "Agua promedio",
      valor: promedioDe(ultimosSiete, "vasosAgua"),
      unidad: "vasos",
    },
    {
      icono: Activity,
      etiqueta: "Estrés promedio",
      valor: promedioDe(ultimosSiete, "nivelEstres"),
      unidad: "/5",
    },
    {
      icono: Monitor,
      etiqueta: "Pantallas promedio",
      valor: promedioDe(ultimosSiete, "horasPantalla"),
      unidad: "h",
    },
  ];

  return (
    <div className="space-y-5">
      <section
        aria-label="Resumen de la última semana"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {metricas.map((metrica) => (
          <article
            key={metrica.etiqueta}
            className="rounded-2xl border border-outline-variant/40 bg-card p-4 shadow-elevation-1"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-on-surface-variant">
              <metrica.icono size={13} className="text-primary" />
              <span className="truncate">{metrica.etiqueta}</span>
            </div>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-heading">
              {metrica.valor ?? "—"}
              <span className="ml-1 text-xs font-medium text-on-surface-variant">
                {metrica.unidad}
              </span>
            </p>
            <p className="mt-1 text-[10px] text-pebble">
              {ultimosSiete.length === 0
                ? "Sin registros"
                : `Sobre ${ultimosSiete.length} ${
                    ultimosSiete.length === 1 ? "día" : "días"
                  }`}
            </p>
          </article>
        ))}
      </section>

      <DiarioBienestar registros={data.diario} hoy={data.hoy} />

      <CorrelacionHabitos correlacion={data.correlacion} />
    </div>
  );
}
