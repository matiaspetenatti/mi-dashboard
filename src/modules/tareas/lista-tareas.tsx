import Link from "next/link";
import { Pencil, Repeat, Trash2, X } from "lucide-react";
import { alternarTarea, borrarTarea, crearSubtarea, agregarTags, quitarTag } from "./actions";
import type { TareaConDetalle } from "./queries";
import { hrefTareas } from "./url";
import { textoRecurrencia } from "./constantes";
import { GrupoBadge, TagChip } from "./chips";

function ItemTarea({ t }: { t: TareaConDetalle }) {
    const hechas = t.subtareas.filter((s) => s.completada).length;
    return (
        <li className="p-3">
            <div className="flex items-center gap-3">
                <form action={alternarTarea.bind(null, t.id)}>
                    <button
                        aria-label="Completar"
                        className={`h-5 w-5 rounded border ${t.completada ? "bg-neutral-900" : t.enCurso ? "border-blue-500 bg-blue-100" : ""}`}
                    />
                </form>
                <div className="flex-1">
                    <p className={`text-sm ${t.completada ? "line-through text-neutral-400" : ""}`}>{t.titulo}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
                        {t.enCurso && !t.completada && <span className="text-blue-600">En curso</span>}
                        {t.fechaLimite && <span>Vence: {t.fechaLimite}</span>}
                        {t.recurrencia && (
                            <span className="inline-flex items-center gap-1">
                                <Repeat size={12} />
                                {textoRecurrencia(t.recurrencia, t.recurrenciaCada)}
                            </span>
                        )}
                        {t.subtareas.length > 0 && (
                            <span>
                                {hechas}/{t.subtareas.length} subtareas
                            </span>
                        )}
                        {t.tags.map((tag) => (
                            <Link key={tag.nombre} href={hrefTareas({ tag: tag.nombre })}>
                                <TagChip tag={tag} />
                            </Link>
                        ))}
                    </div>
                </div>
                <Link href={`/tareas/${t.id}/editar`} aria-label="Editar" className="text-neutral-400 hover:text-neutral-900">
                    <Pencil size={16} />
                </Link>
                <form action={borrarTarea.bind(null, t.id)}>
                    <button aria-label="Borrar" className="text-neutral-400 hover:text-red-600">
                        <Trash2 size={16} />
                    </button>
                </form>
            </div>

            <details className="mt-2 pl-8">
                <summary className="cursor-pointer text-xs text-neutral-500">Subtareas y tags</summary>

                <div className="mt-2 space-y-3">
                    {t.subtareas.length > 0 && (
                        <ul className="space-y-1.5">
                            {t.subtareas.map((s) => (
                                <li key={s.id} className="flex items-center gap-2">
                                    <form action={alternarTarea.bind(null, s.id)}>
                                        <button
                                            aria-label="Completar subtarea"
                                            className={`h-4 w-4 rounded border ${s.completada ? "bg-neutral-900" : ""}`}
                                        />
                                    </form>
                                    <span className={`flex-1 text-sm ${s.completada ? "line-through text-neutral-400" : ""}`}>
                                        {s.titulo}
                                    </span>
                                    <form action={borrarTarea.bind(null, s.id)}>
                                        <button aria-label="Borrar subtarea" className="text-neutral-400 hover:text-red-600">
                                            <Trash2 size={14} />
                                        </button>
                                    </form>
                                </li>
                            ))}
                        </ul>
                    )}

                    <form action={crearSubtarea.bind(null, t.id)} className="flex gap-1">
                        <input
                            name="titulo"
                            placeholder="Nueva subtarea..."
                            required
                            className="flex-1 rounded-md border px-2 py-1 text-sm"
                        />
                        <button className="rounded-md border px-2 text-xs">Agregar</button>
                    </form>

                    <div className="flex flex-wrap items-center gap-1.5">
                        {t.tags.map((tag) => (
                            <form key={tag.nombre} action={quitarTag.bind(null, t.id, tag.nombre)}>
                                <button title="Quitar tag" className="inline-flex items-center gap-0.5">
                                    <TagChip tag={tag} />
                                    <X size={12} className="text-neutral-400" />
                                </button>
                            </form>
                        ))}
                        <form action={agregarTags.bind(null, t.id)} className="flex gap-1">
                            <input
                                name="tags"
                                placeholder="+ tag (casa, trabajo)"
                                required
                                className="w-40 rounded-md border px-2 py-0.5 text-xs"
                            />
                            <button className="rounded-md border px-2 text-xs">OK</button>
                        </form>
                    </div>
                </div>
            </details>
        </li>
    );
}

// agrupa en secciones: grupos por nombre, "Sin grupo" al final
function agruparPorGrupo(tareas: TareaConDetalle[]) {
    const mapa = new Map<number | null, { grupo: TareaConDetalle["grupo"]; items: TareaConDetalle[] }>();
    for (const t of tareas) {
        const clave = t.grupo?.id ?? null;
        const seccion = mapa.get(clave) ?? { grupo: t.grupo, items: [] };
        seccion.items.push(t);
        mapa.set(clave, seccion);
    }
    return [...mapa.values()].sort((a, b) => {
        if (!a.grupo) return 1;
        if (!b.grupo) return -1;
        return a.grupo.nombre.localeCompare(b.grupo.nombre);
    });
}

export function ListaTareas({ tareas }: { tareas: TareaConDetalle[] }) {
    if (tareas.length === 0) {
        return (
            <ul className="rounded-xl border bg-white">
                <li className="p-4 text-sm text-neutral-500">No hay tareas todavía.</li>
            </ul>
        );
    }

    const secciones = agruparPorGrupo(tareas);
    const hayGrupos = secciones.some((s) => s.grupo);

    return (
        <div className="space-y-5">
            {secciones.map((s) => (
                <section key={s.grupo?.id ?? "sin"} className="space-y-2">
                    {hayGrupos && (
                        <h2 className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                            {s.grupo ? <GrupoBadge grupo={s.grupo} /> : "Sin grupo"}
                            <span className="text-xs text-neutral-400">{s.items.length}</span>
                        </h2>
                    )}
                    <ul className="divide-y rounded-xl border bg-white">
                        {s.items.map((t) => (
                            <ItemTarea key={t.id} t={t} />
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}