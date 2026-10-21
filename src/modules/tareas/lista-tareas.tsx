import { getTareas } from "./queries";
import { alternarTarea, borrarTarea } from "./actions";
import { Trash2 } from "lucide-react";

export async function ListaTareas() {
    const tareas = await getTareas();

    return (
        <ul className="divide-y rounded-xl border bg-white">
            {tareas.length === 0 && (
                <li className="p-4 text-sm text-neutral-500">No hay tareas todavía.</li>
            )}
            {tareas.map((t) => (
                <li key={t.id} className="flex items-center gap-3 p-3">
                    <form action={alternarTarea.bind(null, t.id)}>
                        <button
                            aria-label="Completar"
                            className={`h-5 w-5 rounded border ${t.completada ? "bg-neutral-900" : ""}`}
                        />
                    </form>
                    <div className="flex-1">
                        <p className={`text-sm ${t.completada ? "line-through text-neutral-400" : ""}`}>
                            {t.titulo}
                        </p>
                        {t.fechaLimite && (
                            <p className="text-xs text-neutral-500">Vence: {t.fechaLimite}</p>
                        )}
                    </div>
                    <form action={borrarTarea.bind(null, t.id)}>
                        <button aria-label="Borrar" className="text-neutral-400 hover:text-red-600">
                            <Trash2 size={16} />
                        </button>
                    </form>
                </li>
            ))}
        </ul>
    );
}