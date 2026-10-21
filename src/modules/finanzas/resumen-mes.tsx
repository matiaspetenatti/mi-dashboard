import { getResumenDelMes } from "./queries";
import { formatMonto } from "@/lib/format";

export function ResumenSkeleton() {
    return <div className="h-20 animate-pulse rounded-xl bg-neutral-100" />;
}

export async function ResumenMes() {
    const { ingresos, gastos, balance } = await getResumenDelMes();

    const items = [
        { label: "Ingresos", value: ingresos, color: "text-green-600" },
        { label: "Gastos", value: gastos, color: "text-red-600" },
        { label: "Balance", value: balance, color: balance < 0 ? "text-red-600" : "" },
    ];

    return (
        <div className="grid grid-cols-3 gap-3">
            {items.map((i) => (
                <div key={i.label} className="rounded-xl border bg-white p-4">
                    <p className="text-xs text-neutral-500">{i.label}</p>
                    <p className={`text-lg font-semibold ${i.color}`}>{formatMonto(i.value)}</p>
                </div>
            ))}
        </div>
    );
}