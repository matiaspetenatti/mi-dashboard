import { WidgetCard } from "@/components/widget-card";
import { getResumenDelMes } from "./queries";
import { formatMonto } from "@/lib/format";

export function FinanzasWidgetSkeleton() {
    return (
        <WidgetCard title="Balance del mes" href="/finanzas">
            <div className="h-24 animate-pulse rounded-md bg-neutral-100" />
        </WidgetCard>
    );
}

export async function FinanzasWidget() {
    const { ingresos, gastos, balance } = await getResumenDelMes();

    return (
        <WidgetCard title="Balance del mes" href="/finanzas">
            <p className={`text-3xl font-semibold ${balance < 0 ? "text-red-600" : ""}`}>
                {formatMonto(balance)}
            </p>
            <p className="mb-3 text-sm text-neutral-500">ingresos − gastos</p>
            <div className="flex justify-between text-sm">
                <span className="text-green-600">↑ {formatMonto(ingresos)}</span>
                <span className="text-red-600">↓ {formatMonto(gastos)}</span>
            </div>
        </WidgetCard>
    );
}