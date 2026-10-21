import { Trash2 } from "lucide-react";
import { getGrupos, getTodosLosTags } from "./queries";
import { actualizarGrupo, actualizarTag, borrarGrupo, borrarTag, crearGrupo } from "./actions-organizar";
import { GrupoBadge, TagChip } from "./chips";
import { SelectorColor, SelectorIcono } from "./selectores";

const input = "rounded-md border px-3 py-2 text-sm";
const guardar = "rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white";

export async function Organizar() {
    const [listaTags, listaGrupos] = await Promise.all([getTodosLosTags(), getGrupos()]);

    return (
        <div className="space-y-10">
            {/* Grupos */}
            <section className="space-y-3">
                <h2 className="text-sm font-medium text-neutral-500">Grupos</h2>

                <form action={crearGrupo} className="space-y-3 rounded-xl border bg-white p-4">
                    <div className="flex gap-2">
                        <input name="nombre" placeholder="Nuevo grupo (ej: Facultad, Casa)..." required className={`${input} flex-1`} />
                        <button className={guardar}>Crear</button>
                    </div>
                    <SelectorColor />
                </form>

                <ul className="divide-y rounded-xl border bg-white">
                    {listaGrupos.length === 0 && <li className="p-4 text-sm text-neutral-500">Todavía no hay grupos.</li>}
                    {listaGrupos.map((g) => (
                        <li key={g.id} className="p-3">
                            <details>
                                <summary className="flex cursor-pointer items-center justify-between">
                                    <GrupoBadge grupo={g} />
                                    <span className="text-xs text-neutral-400">Editar</span>
                                </summary>
                                <div className="mt-3 flex items-start gap-3">
                                    <form action={actualizarGrupo.bind(null, g.id)} className="flex-1 space-y-3">
                                        <input name="nombre" defaultValue={g.nombre} required className={`${input} w-full`} />
                                        <SelectorColor defaultValue={g.color} />
                                        <button className={guardar}>Guardar</button>
                                    </form>
                                    <form action={borrarGrupo.bind(null, g.id)}>
                                        <button aria-label="Borrar grupo" className="text-neutral-400 hover:text-red-600">
                                            <Trash2 size={16} />
                                        </button>
                                    </form>
                                </div>
                            </details>
                        </li>
                    ))}
                </ul>
                <p className="text-xs text-neutral-400">Al borrar un grupo, sus tareas quedan sin grupo.</p>
            </section>

            {/* Tags */}
            <section className="space-y-3">
                <h2 className="text-sm font-medium text-neutral-500">Tags</h2>
                <ul className="divide-y rounded-xl border bg-white">
                    {listaTags.length === 0 && (
                        <li className="p-4 text-sm text-neutral-500">Los tags se crean al ponérselos a una tarea.</li>
                    )}
                    {listaTags.map((t) => (
                        <li key={t.id} className="p-3">
                            <details>
                                <summary className="flex cursor-pointer items-center justify-between">
                                    <TagChip tag={t} />
                                    <span className="text-xs text-neutral-400">
                                        {t.usos} {t.usos === 1 ? "tarea" : "tareas"} · Editar
                                    </span>
                                </summary>
                                <div className="mt-3 flex items-start gap-3">
                                    <form action={actualizarTag.bind(null, t.id)} className="flex-1 space-y-3">
                                        <input name="nombre" defaultValue={t.nombre} required className={`${input} w-full`} />
                                        <SelectorColor defaultValue={t.color} />
                                        <SelectorIcono defaultValue={t.icono} />
                                        <button className={guardar}>Guardar</button>
                                    </form>
                                    <form action={borrarTag.bind(null, t.id)}>
                                        <button aria-label="Borrar tag" className="text-neutral-400 hover:text-red-600">
                                            <Trash2 size={16} />
                                        </button>
                                    </form>
                                </div>
                            </details>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}