import {
  ChefHat,
  Clock3,
  ShoppingBasket,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { formatMonto } from "@/lib/format";

function Kpi({
  icono: Icono,
  etiqueta,
  valor,
  detalle,
  acento,
}: {
  icono: LucideIcon;
  etiqueta: string;
  valor: string;
  detalle: string;
  acento: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-outline-variant/40 bg-card p-4 shadow-elevation-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-pebble">
          {etiqueta}
        </p>
        <span
          className={cn(
            "grid size-7 place-items-center rounded-full bg-surface-container",
            acento,
          )}
        >
          <Icono size={14} />
        </span>
      </div>
      <p className="text-2xl font-extrabold leading-none tracking-tight text-heading">
        {valor}
      </p>
      <p className="text-[11px] leading-tight text-on-surface-variant">
        {detalle}
      </p>
    </div>
  );
}

export function KpisComida({
  items,
  porVencer,
  recetas,
  compras,
  totalCentavos,
}: {
  items: number;
  porVencer: number;
  recetas: number;
  compras: number;
  totalCentavos: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <Kpi
        icono={Warehouse}
        etiqueta="En despensa"
        valor={String(items)}
        detalle={
          items === 1 ? "1 ingrediente cargado" : `${items} ingredientes cargados`
        }
        acento="text-primary"
      />
      <Kpi
        icono={Clock3}
        etiqueta="Por vencer"
        valor={String(porVencer)}
        detalle={
          porVencer === 0
            ? "Nada urgente por ahora"
            : "Vencen en los próximos 3 días"
        }
        acento={porVencer > 0 ? "text-error" : "text-success"}
      />
      <Kpi
        icono={ChefHat}
        etiqueta="Recetario"
        valor={String(recetas)}
        detalle={
          recetas === 1 ? "1 receta guardada" : `${recetas} recetas guardadas`
        }
        acento="text-secondary"
      />
      <Kpi
        icono={ShoppingBasket}
        etiqueta="Por comprar"
        valor={String(compras)}
        detalle={
          compras === 0
            ? "Lista vacía"
            : `${compras} ítems · ${formatMonto(totalCentavos)}`
        }
        acento="text-tertiary"
      />
    </div>
  );
}

export function KpisComidaSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, indice) => (
        <div
          key={indice}
          className="h-[118px] rounded-2xl bg-surface-container-high"
        />
      ))}
    </div>
  );
}
