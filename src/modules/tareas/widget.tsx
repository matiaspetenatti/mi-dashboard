import { WidgetCard } from "@/components/widget-card";
import { getPendientesCount, getProximasTareas } from "./queries";

export function TareasWidgetSkeleton() {
    return (
        <WidgetCard title="Tareas pendientes" href="/tareas">
            <div className="h-24 animate-pulse rounded-md bg-neutral-100" />
        </WidgetCard>
    );
}

export async function TareasWidget() {
    const [total, proximas] = await Promise.all([getPendientesCount(), getProximasTareas(3)]);

    return (
        <WidgetCard title="Tareas pendientes" href="/tareas">
            <p className="text-3xl font-semibold">{total}</p>
            <p className="mb-3 text-sm text-neutral-500">
                {total === 1 ? "pendiente" : "pendientes"}
            </p>

            {proximas.length === 0 ? (
                <p className="text-sm text-neutral-500">Todo al día 🎉</p>
            ) : (
                <ul className="space-y-1.5">
                    {proximas.map((t) => (
                        <li key={t.id} className="flex items-baseline justify-between gap-2 text-sm">
                            <span className="truncate">{t.titulo}</span>
                            {t.fechaLimite && (
                                <span className="shrink-0 text-xs text-neutral-500">{t.fechaLimite}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </WidgetCard>
    );
}