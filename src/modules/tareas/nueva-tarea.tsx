import { crearTarea } from "./actions";
import { getGrupos } from "./queries";
import { SelectorRecurrencia } from "./selector-recurrencia";

const input = "rounded-md border px-3 py-2 text-sm";

export async function NuevaTarea() {
    const grupos = await getGrupos();

    return (
        <form action={crearTarea} className="flex flex-wrap items-center gap-2">
            <input name="titulo" placeholder="Nueva tarea..." required className={`${input} min-w-48 flex-1`} />
            <input type="date" name="fechaLimite" className={input} />
            {grupos.length > 0 && (
                <select name="grupoId" className={input} defaultValue="">
                    <option value="">Sin grupo</option>
                    {grupos.map((g) => (
                        <option key={g.id} value={g.id}>
                            {g.nombre}
                        </option>
                    ))}
                </select>
            )}
            <SelectorRecurrencia />
            <input name="tags" placeholder="Tags (casa, trabajo)" className={`${input} w-44`} />
            <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white">Agregar</button>
        </form>
    );
}