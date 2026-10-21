import Link from "next/link";
import { ChevronLeft, ChevronRight, Repeat } from "lucide-react";
import type { TareaConDetalle } from "./queries";
import { hrefTareas } from "./url";

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MAX_POR_DIA = 3;

function moverMes(mes: string, delta: number) {
    const [y, m] = mes.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

type Props = { tareas: TareaConDetalle[]; mes: string; hoy: string; tag?: string; grupo?: string };

export function Calendario({ tareas, mes, hoy, tag, grupo }: Props) {
    const [y, m] = mes.split("-").map(Number);
    const diasMes = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // semana arranca en lunes

    const celdas: (number | null)[] = [
        ...Array<null>(offset).fill(null),
        ...Array.from({ length: diasMes }, (_, i) => i + 1),
    ];
    while (celdas.length % 7 !== 0) celdas.push(null);

    const porDia = new Map<string, TareaConDetalle[]>();
    let sinFecha = 0;
    for (const t of tareas) {
        if (!t.fechaLimite) {
            if (!t.completada) sinFecha++;
            continue;
        }
        if (!t.fechaLimite.startsWith(mes)) continue;
        porDia.set(t.fechaLimite, [...(porDia.get(t.fechaLimite) ?? []), t]);
    }

    const nav = "rounded-md border p-1.5 hover:bg-neutral-100";

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                    {MESES[m - 1]} {y}
                </h2>
                <div className="flex gap-1">
                    <Link href={hrefTareas({ vista: "calendario", tag, grupo, mes: moverMes(mes, -1) })} className={nav} aria-label="Mes anterior">
                        <ChevronLeft size={16} />
                    </Link>
                    <Link href={hrefTareas({ vista: "calendario", tag, grupo })} className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-100">
                        Hoy
                    </Link>
                    <Link href={hrefTareas({ vista: "calendario", tag, grupo, mes: moverMes(mes, 1) })} className={nav} aria-label="Mes siguiente">
                        <ChevronRight size={16} />
                    </Link>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="grid min-w-[640px] grid-cols-7 overflow-hidden rounded-xl border bg-white text-xs">
                    {DIAS.map((d) => (
                        <div key={d} className="border-b bg-neutral-50 px-2 py-1.5 font-medium text-neutral-500">
                            {d}
                        </div>
                    ))}
                    {celdas.map((dia, i) => {
                        if (dia === null) {
                            return <div key={i} className="min-h-24 border-b border-r bg-neutral-50/50" />;
                        }
                        const fecha = `${mes}-${String(dia).padStart(2, "0")}`;
                        const delDia = porDia.get(fecha) ?? [];
                        const esHoy = fecha === hoy;
                        return (
                            <div key={i} className="min-h-24 space-y-1 border-b border-r p-1.5">
                                <span
                                    className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 ${esHoy ? "bg-neutral-900 text-white" : "text-neutral-500"
                                        }`}
                                >
                                    {dia}
                                </span>
                                {delDia.slice(0, MAX_POR_DIA).map((t) => (
                                    <p
                                        key={t.id}
                                        title={t.titulo}
                                        className={`flex items-center gap-1 truncate rounded bg-neutral-100 px-1.5 py-0.5 ${t.completada ? "text-neutral-400 line-through" : ""
                                            }`}
                                    >
                                        {t.recurrencia && <Repeat size={10} className="shrink-0" />}
                                        <span className="truncate">{t.titulo}</span>
                                    </p>
                                ))}
                                {delDia.length > MAX_POR_DIA && (
                                    <p className="px-1 text-neutral-400">+{delDia.length - MAX_POR_DIA} más</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {sinFecha > 0 && (
                <p className="text-xs text-neutral-400">
                    {sinFecha} {sinFecha === 1 ? "tarea pendiente sin fecha no aparece" : "tareas pendientes sin fecha no aparecen"} en el calendario.
                </p>
            )}
        </div>
    );
}