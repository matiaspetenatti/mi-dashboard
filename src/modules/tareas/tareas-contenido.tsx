import Link from "next/link";
import { connection } from "next/server";
import { Settings2 } from "lucide-react";
import { getGrupos, getTagsEnUso, getTareas } from "./queries";
import { ListaTareas } from "./lista-tareas";
import { Calendario } from "./calendario.tsx";
import { Kanban } from "./kanban";
import { hrefTareas, type FiltrosUrl } from "./url";
import { fechaHoy, mesActual } from "@/lib/format";
import { TagChip } from "./chips";

type Params = Promise<{ tag?: string; grupo?: string; vista?: string; mes?: string }>;

export async function TareasContenido({ searchParams }: { searchParams: Params }) {
    await connection();
    const { tag, grupo, vista: vistaParam, mes: mesParam } = await searchParams;
    const vista = vistaParam === "calendario" || vistaParam === "kanban" ? vistaParam : "lista";
    const mes = mesParam && /^\d{4}-(0[1-9]|1[0-2])$/.test(mesParam) ? mesParam : mesActual();

    const [tareas, tagsEnUso, grupos] = await Promise.all([
        getTareas({ tag, grupo }),
        getTagsEnUso(),
        getGrupos(),
    ]);

    const href = (over: FiltrosUrl) =>
        hrefTareas({ vista, tag, grupo, mes: vista === "calendario" ? mes : undefined, ...over });

    const tab = (activa: boolean) =>
        `rounded px-3 py-1 ${activa ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}`;
    const chip = (activa: boolean) =>
        `rounded-full border px-2.5 py-0.5 text-xs ${activa ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"}`;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-1 rounded-md border p-0.5 text-sm">
                    <Link href={href({ vista: "lista", mes: undefined })} className={tab(vista === "lista")}>
                        Lista
                    </Link>
                    <Link href={href({ vista: "kanban", mes: undefined })} className={tab(vista === "kanban")}>
                        Kanban
                    </Link>
                    <Link href={href({ vista: "calendario", mes: undefined })} className={tab(vista === "calendario")}>
                        Calendario
                    </Link>
                </div>
                <Link
                    href="/tareas/organizar"
                    className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900"
                >
                    <Settings2 size={16} />
                    Tags y grupos
                </Link>
            </div>

            {grupos.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    <Link href={href({ grupo: undefined })} className={chip(!grupo)}>
                        Todos los grupos
                    </Link>
                    {grupos.map((g) => (
                        <Link key={g.id} href={href({ grupo: String(g.id) })} className={chip(grupo === String(g.id))}>
                            {g.nombre}
                        </Link>
                    ))}
                    <Link href={href({ grupo: "sin" })} className={chip(grupo === "sin")}>
                        Sin grupo
                    </Link>
                </div>
            )}

            {tagsEnUso.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    <Link href={href({ tag: undefined })} className={chip(!tag)}>
                        Todos los tags
                    </Link>
                    {tagsEnUso.map((t) => (
                        <Link
                            key={t.nombre}
                            href={href({ tag: t.nombre })}
                            className={`rounded-full ${tag === t.nombre ? "ring-2 ring-neutral-900 ring-offset-1" : ""}`}
                        >
                            <TagChip tag={t} />
                        </Link>
                    ))}
                </div>
            )}

            {vista === "kanban" && <Kanban tareas={tareas} />}
            {vista === "calendario" && <Calendario tareas={tareas} mes={mes} hoy={fechaHoy()} tag={tag} grupo={grupo} />}
            {vista === "lista" && <ListaTareas tareas={tareas} />}
        </div>
    );
}