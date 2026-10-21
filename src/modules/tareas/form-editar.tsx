import Link from "next/link";
import { notFound } from "next/navigation";
import { actualizarTarea } from "./actions";
import { getGrupos, getTarea } from "./queries";
import { SelectorRecurrencia } from "./selector-recurrencia";
import { columnaDe, columnas } from "./constantes";

const input = "w-full rounded-md border px-3 py-2 text-sm";
const label = "block space-y-1";
const etiqueta = "text-sm text-neutral-500";

export async function FormEditar({ params }: { params: Promise<{ id: string }> }) {
    const id = Number((await params).id);
    if (!Number.isInteger(id)) notFound();

    const [tarea, grupos] = await Promise.all([getTarea(id), getGrupos()]);
    if (!tarea || tarea.parentId) notFound();

    return (
        <form action={actualizarTarea.bind(null, tarea.id)} className="space-y-4">
            <label className={label}>
                <span className={etiqueta}>Título</span>
                <input name="titulo" defaultValue={tarea.titulo} required className={input} />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
                <label className={label}>
                    <span className={etiqueta}>Fecha límite</span>
                    <input type="date" name="fechaLimite" defaultValue={tarea.fechaLimite ?? ""} className={input} />
                </label>
                <label className={label}>
                    <span className={etiqueta}>Grupo</span>
                    <select name="grupoId" defaultValue={tarea.grupoId ?? ""} className={input}>
                        <option value="">Sin grupo</option>
                        {grupos.map((g) => (
                            <option key={g.id} value={g.id}>
                                {g.nombre}
                            </option>
                        ))}
                    </select>
                </label>
                <label className={label}>
                    <span className={etiqueta}>Estado</span>
                    <select name="estado" defaultValue={columnaDe(tarea)} className={input}>
                        {columnas.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.titulo}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className={label}>
                <span className={etiqueta}>Repetición</span>
                <SelectorRecurrencia unidad={tarea.recurrencia} cada={tarea.recurrenciaCada} />
            </div>

            <label className={label}>
                <span className={etiqueta}>Tags (separados por coma)</span>
                <input name="tags" defaultValue={tarea.tags.join(", ")} placeholder="casa, trabajo" className={input} />
            </label>

            <div className="flex gap-2">
                <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white">Guardar</button>
                <Link href="/tareas" className="rounded-md border px-4 py-2 text-sm hover:bg-neutral-100">
                    Cancelar
                </Link>
            </div>
        </form>
    );
}