import { WidgetCard } from "@/components/widget-card";
import { getProximoExamen } from "./queries";
import { diasHasta, textoDias } from "@/lib/format";

export function EstudioWidgetSkeleton() {
    return (
        <WidgetCard title="Próximo examen" href="/estudio">
            <div className="h-24 animate-pulse rounded-md bg-neutral-100" />
        </WidgetCard>
    );
}

export async function EstudioWidget() {
    const proximo = await getProximoExamen();

    return (
        <WidgetCard title="Próximo examen" href="/estudio">
            {proximo ? (
                <>
                    <p className="text-lg font-semibold">{proximo.materia}</p>
                    <p className="text-sm capitalize text-neutral-500">
                        {proximo.tipo} · {proximo.fecha}
                    </p>
                    <p className="mt-3 text-2xl font-semibold">
                        {textoDias(diasHasta(proximo.fecha, proximo.hoy))}
                    </p>
                </>
            ) : (
                <p className="text-sm text-neutral-500">Sin exámenes cargados por delante.</p>
            )}
        </WidgetCard>
    );
}