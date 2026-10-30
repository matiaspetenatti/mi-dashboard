import Link from "next/link";
import { Download, HeartPulse } from "lucide-react";
import { cn } from "cn";
import { vistaSalud, type VistaSalud } from "./constantes";
import type { ResumenSalud } from "./queries";
import { VistaBienestar } from "./vista-bienestar";
import { VistaMigrana } from "./vista-migrana";

const PESTANAS: Array<{ vista: VistaSalud; label: string; href: string }> = [
  { vista: "migrana", label: "Migraña", href: "/salud" },
  { vista: "bienestar", label: "Bienestar", href: "/salud?vista=bienestar" },
];

export function SaludContenido({
  data,
  vista,
  ahora,
}: {
  data: ResumenSalud;
  vista: VistaSalud;
  ahora: string;
}) {
  const desde = `${data.mes}-01`;
  const informe = `/api/salud/informe?desde=${desde}&hasta=${data.hoy}`;

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-pebble">
            Bienestar y seguimiento
          </p>
          <h1 className="mt-0.5 text-4xl font-extrabold tracking-tight text-heading lg:text-5xl">
            Salud
          </h1>
          <p className="mt-1 max-w-xl text-sm text-charcoal">
            Registrá tus crisis de migraña y tu diario de bienestar para
            entender qué hábitos se relacionan con el dolor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 bg-card px-3 py-1.5 text-[11px] font-semibold text-on-surface-variant">
            <HeartPulse size={13} className="text-primary" />
            {data.totalEpisodios}{" "}
            {data.totalEpisodios === 1 ? "episodio" : "episodios"} en total
          </span>
          <a
            href={informe}
            className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 bg-card px-3.5 py-1.5 text-xs font-bold text-charcoal transition-colors hover:border-outline hover:bg-surface-container-low"
          >
            <Download size={14} />
            Informe PDF del mes
          </a>
        </div>
      </header>

      <nav
        aria-label="Vistas de Salud"
        className="flex w-fit items-center gap-1 rounded-full border border-outline-variant/40 bg-card p-1 shadow-elevation-1"
      >
        {PESTANAS.map((pestana) => {
          const activa = vista === pestana.vista;

          return (
            <Link
              key={pestana.vista}
              href={pestana.href}
              aria-current={activa ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
                activa
                  ? "bg-inverse-surface text-inverse-on-surface"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-heading",
              )}
            >
              {pestana.label}
            </Link>
          );
        })}
      </nav>

      {vistaSalud(vista) === "bienestar" ? (
        <VistaBienestar data={data} />
      ) : (
        <VistaMigrana data={data} ahora={ahora} />
      )}
    </div>
  );
}

export function SaludSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-40 rounded-2xl bg-surface-container-high" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, indice) => (
          <div
            key={indice}
            className="h-32 rounded-2xl bg-surface-container-high"
          />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="h-96 rounded-2xl bg-surface-container-high lg:col-span-8" />
        <div className="h-96 rounded-2xl bg-surface-container-high lg:col-span-4" />
      </div>
      <div className="h-64 rounded-2xl bg-surface-container-high" />
    </div>
  );
}
