import Link from "next/link";
import { ChefHat, CookingPot } from "lucide-react";
import { cn } from "cn";
import {
  PESTANAS_COMIDA,
  etiquetaMomento,
  vistaComida,
  type VistaComida,
} from "./constantes";
import type { ResumenComida } from "./queries";
import { ChefIa } from "./components/chef-ia";
import { KpisComida } from "./components/kpis";
import { VistaCompras } from "./components/vista-compras";
import { VistaDespensa } from "./components/vista-despensa";
import { VistaMenu } from "./components/vista-menu";
import { VistaRecetario } from "./components/vista-recetario";

function enlaceVista(vista: VistaComida, semana: string) {
  if (vista === "menu") return `/comida?vista=menu&semana=${semana}`;
  if (vista === "despensa") return "/comida";
  return `/comida?vista=${vista}`;
}

export function ComidaContenido({
  data,
  vista,
  seleccionInicial,
}: {
  data: ResumenComida;
  vista: VistaComida;
  seleccionInicial: number[];
}) {
  const actual = vistaComida(vista);
  const platosHoy = data.menu.filter((slot) => slot.dia === data.hoy);
  const proximo = platosHoy.find((slot) => !slot.hecho);

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-pebble">
            Cocina y despensa
          </p>
          <h1 className="mt-0.5 text-4xl font-extrabold tracking-tight text-heading lg:text-5xl">
            Comida
          </h1>
          <p className="mt-1 max-w-xl text-sm text-charcoal">
            Controlá lo que tenés, generá recetas con lo que hay y planificá la
            semana sin volver del súper con las manos vacías.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {proximo && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 bg-card px-3 py-1.5 text-[11px] font-semibold text-on-surface-variant">
              <CookingPot size={13} className="text-primary" />
              Hoy: {proximo.titulo}
            </span>
          )}
          <Link
            href="/comida?vista=chef"
            className="inline-flex items-center gap-1.5 rounded-full border border-forest-ink/20 bg-lime-voltage px-3.5 py-1.5 text-xs font-bold text-forest-ink transition-all hover:brightness-105"
          >
            <ChefHat size={14} />
            Abrir Chef IA
          </Link>
        </div>
      </header>

      <KpisComida
        items={data.kpis.items}
        porVencer={data.kpis.porVencer}
        recetas={data.kpis.recetas}
        compras={data.kpis.comprasPendientes}
        totalCentavos={data.kpis.totalCompraCentavos}
      />

      <nav
        aria-label="Vistas de Comida"
        className="-mx-1 flex items-center gap-1 overflow-x-auto rounded-full border border-outline-variant/40 bg-card p-1 shadow-elevation-1 sm:w-fit sm:overflow-visible"
      >
        {PESTANAS_COMIDA.map((pestana) => {
          const activa = actual === pestana.vista;

          return (
            <Link
              key={pestana.vista}
              href={enlaceVista(pestana.vista, data.semana)}
              aria-current={activa ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
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

      {actual === "chef" && (
        <ChefIa
          items={data.items}
          seleccionInicial={seleccionInicial}
          hoy={data.hoy}
        />
      )}

      {actual === "menu" && (
        <VistaMenu
          semana={data.semana}
          dias={data.dias}
          menu={data.menu}
          recetas={data.recetas}
          hoy={data.hoy}
        />
      )}

      {actual === "recetario" && (
        <VistaRecetario recetas={data.recetas} items={data.items} />
      )}

      {actual === "compras" && (
        <VistaCompras lista={data.lista} items={data.items} />
      )}

      {actual === "despensa" && (
        <VistaDespensa items={data.items} hoy={data.hoy} />
      )}

      <p className="text-[11px] text-pebble">
        {platosHoy.length > 0
          ? `${platosHoy.length} ${
              platosHoy.length === 1 ? "plato" : "platos"
            } para hoy: ${platosHoy
              .map((slot) => `${etiquetaMomento(slot.momento).toLowerCase()} ${slot.titulo ?? ""}`)
              .join(" · ")}`
          : "Todavía no cargaste platos para hoy."}
      </p>
    </div>
  );
}

export function ComidaSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-24 rounded-2xl bg-surface-container-high" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, indice) => (
          <div
            key={indice}
            className="h-[118px] rounded-2xl bg-surface-container-high"
          />
        ))}
      </div>
      <div className="h-10 w-72 rounded-full bg-surface-container-high" />
      <div className="h-[420px] rounded-2xl bg-surface-container-high" />
    </div>
  );
}
