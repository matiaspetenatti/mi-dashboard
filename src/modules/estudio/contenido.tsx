import { Trash2 } from "lucide-react";
import { getEstudioData } from "./queries";
import { crearExamen, borrarExamen, borrarMateria, guardarNota } from "./actions";
import { diasHasta, textoDias } from "@/lib/format";

const input = "rounded-md border px-3 py-2 text-sm";

export async function EstudioContenido() {
    const { materias, examenes, hoy } = await getEstudioData();

    const proximos = examenes.filter((e) => e.fecha >= hoy).reverse(); // más cercano primero
    const pasados = examenes.filter((e) => e.fecha < hoy);

    return (
        <div className="space-y-8">
            {/* Nuevo examen */}
            {materias.length > 0 && (
                <form action={crearExamen} className="flex flex-wrap gap-2">
                    <select name="materiaId" className={input}>
                        {materias.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.nombre}
                            </option>
                        ))}
                    </select>
                    <select name="tipo" className={input}>
                        <option value="parcial">Parcial</option>
                        <option value="final">Final</option>
                        <option value="recuperatorio">Recuperatorio</option>
                        <option value="tp">TP</option>
                    </select>
                    <input type="date" name="fecha" required className={input} />
                    <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white">
                        Agregar examen
                    </button>
                </form>
            )}

            {/* Próximos */}
            <section className="space-y-2">
                <h2 className="text-sm font-medium text-neutral-500">Próximos exámenes</h2>
                <ul className="divide-y rounded-xl border bg-white">
                    {proximos.length === 0 && (
                        <li className="p-4 text-sm text-neutral-500">No hay exámenes por delante.</li>
                    )}
                    {proximos.map((e) => (
                        <li key={e.id} className="flex items-center gap-3 p-3">
                            <div className="flex-1">
                                <p className="text-sm">{e.materia}</p>
                                <p className="text-xs text-neutral-500">
                                    {e.tipo} · {e.fecha}
                                </p>
                            </div>
                            <span className="text-xs text-neutral-500">
                                {textoDias(diasHasta(e.fecha, hoy))}
                            </span>
                            <form action={borrarExamen.bind(null, e.id)}>
                                <button aria-label="Borrar" className="text-neutral-400 hover:text-red-600">
                                    <Trash2 size={16} />
                                </button>
                            </form>
                        </li>
                    ))}
                </ul>
            </section>

            {/* Pasados, con nota */}
            {pasados.length > 0 && (
                <section className="space-y-2">
                    <h2 className="text-sm font-medium text-neutral-500">Rendidos</h2>
                    <ul className="divide-y rounded-xl border bg-white">
                        {pasados.map((e) => (
                            <li key={e.id} className="flex items-center gap-3 p-3">
                                <div className="flex-1">
                                    <p className="text-sm">{e.materia}</p>
                                    <p className="text-xs text-neutral-500">
                                        {e.tipo} · {e.fecha}
                                    </p>
                                </div>
                                {e.nota !== null ? (
                                    <span className="text-sm font-medium">{e.nota}</span>
                                ) : (
                                    <form action={guardarNota.bind(null, e.id)} className="flex gap-1">
                                        <input
                                            name="nota"
                                            inputMode="decimal"
                                            placeholder="Nota"
                                            className={`${input} w-20 py-1`}
                                        />
                                        <button className="rounded-md border px-2 text-xs">OK</button>
                                    </form>
                                )}
                                <form action={borrarExamen.bind(null, e.id)}>
                                    <button aria-label="Borrar" className="text-neutral-400 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </form>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Materias */}
            {materias.length > 0 && (
                <section className="space-y-2">
                    <h2 className="text-sm font-medium text-neutral-500">Materias</h2>
                    <ul className="divide-y rounded-xl border bg-white">
                        {materias.map((m) => (
                            <li key={m.id} className="flex items-center justify-between p-3">
                                <span className="text-sm">{m.nombre}</span>
                                <form action={borrarMateria.bind(null, m.id)}>
                                    <button aria-label="Borrar" className="text-neutral-400 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </form>
                            </li>
                        ))}
                    </ul>
                    <p className="text-xs text-neutral-400">
                        Al borrar una materia se borran también sus exámenes.
                    </p>
                </section>
            )}
        </div>
    );
}