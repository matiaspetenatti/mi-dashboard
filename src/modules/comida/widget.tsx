import Link from "next/link";
import {
  ChefHat,
  Clock3,
  ShoppingBasket,
  UtensilsCrossed,
  Warehouse,
} from "lucide-react";
import { WidgetCard } from "@/components/widget-card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMonto } from "@/lib/format";
import { COMIDA_HREF, MOMENTOS, etiquetaMomento } from "./constantes";
import { formatearCantidad } from "./lib/cantidades";
import { menuDelDia, getComida } from "./queries";
import { inicioSemana } from "./lib/semana";

function Metrica({
  icono: Icono,
  etiqueta,
  valor,
  detalle,
}: {
  icono: React.ComponentType<{ size?: number; className?: string }>;
  etiqueta: string;
  valor: string;
  detalle: string;
}) {
  return (
    <div className="rounded-[16px] border border-outline-variant/60 bg-surface-bright p-3">
      <div className="flex items-center gap-1.5">
        <Icono size={12} className="text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-wide text-pebble">
          {etiqueta}
        </p>
      </div>
      <p className="mt-1 text-xl font-bold tracking-tight text-heading">{valor}</p>
      <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-on-surface-variant">
        {detalle}
      </p>
    </div>
  );
}

export function ComidaWidgetSkeleton() {
  return (
    <WidgetCard
      title="Comida"
      subtitle="Cargando despensa y menú"
      href={COMIDA_HREF}
      icon={UtensilsCrossed}
      accent="tertiary"
    >
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, indice) => (
          <Skeleton key={indice} className="h-[86px] w-full rounded-[16px]" />
        ))}
      </div>
    </WidgetCard>
  );
}

export async function ComidaWidget() {
  let data: Awaited<ReturnType<typeof getComida>>;

  try {
    data = await getComida(inicioSemana());
  } catch {
    return (
      <WidgetCard
        title="Comida"
        subtitle="Despensa, recetas y compras"
        href={COMIDA_HREF}
        icon={UtensilsCrossed}
        accent="tertiary"
      >
        <div className="flex flex-1 flex-col justify-center gap-1 py-6 text-center">
          <UtensilsCrossed className="mx-auto h-6 w-6 text-primary" />
          <p className="text-sm font-medium text-on-surface">
            No se pudo cargar Comida
          </p>
          <p className="text-xs text-on-surface-variant">
            Entrá al módulo para reintentar.
          </p>
        </div>
      </WidgetCard>
    );
  }

  const delDia = menuDelDia(data.menu, data.hoy);
  const proximo = MOMENTOS.map((momento) =>
    delDia.find((slot) => slot.momento === momento.valor && !slot.hecho),
  ).find(Boolean);
  const porVencer = data.kpis.porVencer;

  const vacio =
    data.items.length === 0 && data.recetas.length === 0 && data.menu.length === 0;

  return (
    <WidgetCard
      title="Comida"
      subtitle="Despensa, recetas y menú semanal"
      href={COMIDA_HREF}
      icon={UtensilsCrossed}
      accent="tertiary"
      footer={
        <>
          <span>
            {data.recetas.length}{" "}
            {data.recetas.length === 1 ? "receta guardada" : "recetas guardadas"}
          </span>
          <Link
            href={COMIDA_HREF}
            className="inline-flex items-center gap-1 font-bold text-primary transition-opacity hover:opacity-75"
          >
            Abrir Comida →
          </Link>
        </>
      }
    >
      {vacio ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[16px] border border-dashed border-outline-variant/70 bg-surface-bright px-4 py-8 text-center">
          <UtensilsCrossed size={22} className="text-primary" />
          <p className="text-sm font-semibold text-heading">
            La cocina está vacía
          </p>
          <p className="text-xs text-on-surface-variant">
            Cargá lo que tenés en la heladera y dejá que el Chef IA arme la
            primera receta.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Metrica
            icono={Warehouse}
            etiqueta="Despensa"
            valor={String(data.kpis.items)}
            detalle={
              porVencer > 0
                ? `${porVencer} por vencer`
                : "Sin vencimientos urgentes"
            }
          />
          <Metrica
            icono={Clock3}
            etiqueta="Hoy"
            valor={
              proximo?.minutos ? `${proximo.minutos} min` : String(delDia.length)
            }
            detalle={
              proximo
                ? `${etiquetaMomento(proximo.momento)}: ${
                    proximo.titulo ?? "Sin título"
                  }`
                : delDia.length > 0
                  ? "Todos los platos del día hechos"
                  : "Sin menú para hoy"
            }
          />
          <Metrica
            icono={ChefHat}
            etiqueta="Recetario"
            valor={String(data.kpis.recetas)}
            detalle={
              data.recetas[0]
                ? `Última: ${data.recetas[0].titulo}`
                : "Todavía no guardaste recetas"
            }
          />
          <Metrica
            icono={ShoppingBasket}
            etiqueta="Compras"
            valor={String(data.kpis.comprasPendientes)}
            detalle={
              data.kpis.comprasPendientes > 0
                ? `${formatMonto(data.kpis.totalCompraCentavos)} estimados`
                : "Lista al día"
            }
          />
        </div>
      )}

      {delDia.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] text-on-surface-variant">
          {delDia.map((slot) => (
            <span
              key={slot.id}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
                slot.hecho
                  ? "bg-success-container text-on-success-container line-through"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {slot.hecho ? "✓" : ""} {slot.titulo ?? "Sin título"}
            </span>
          ))}
        </div>
      )}

      {data.lista.find((item) => !item.comprado) && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-on-surface-variant">
          <ShoppingBasket size={11} className="text-primary" />
          Próxima compra:{" "}
          {formatearCantidad(
            data.lista.find((item) => !item.comprado)!.cantidad,
            data.lista.find((item) => !item.comprado)!.unidad,
          )}{" "}
          de {data.lista.find((item) => !item.comprado)!.nombre}
        </div>
      )}
    </WidgetCard>
  );
}
