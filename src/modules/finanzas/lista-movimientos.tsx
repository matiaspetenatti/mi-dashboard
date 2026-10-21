import { Trash2 } from "lucide-react";
import { getMovimientosDelMes } from "./queries";
import { borrarMovimiento } from "./actions";
import { formatMonto } from "@/lib/format";

export async function ListaMovimientos() {
    const items = await getMovimientosDelMes();

    return (
        <ul className="divide-y rounded-xl border bg-white">
            {items.length === 0 && (
                <li className="p-4 text-sm text-neutral-500">Todavía no hay movimientos este mes.</li>
            )}
            {items.map((m) => (
                <li key={m.id} className="flex items-center gap-3 p-3">
                    <div className="flex-1">
                        <p className="text-sm">{m.descripcion || m.categoria}</p>
                        <p className="text-xs text-neutral-500">
                            {m.categoria} · {m.fecha}
                        </p>
                    </div>
                    <span
                        className={`text-sm font-medium ${m.tipo === "ingreso" ? "text-green-600" : "text-red-600"
                            }`}
                    >
                        {m.tipo === "gasto" && "− "}
                        {formatMonto(m.monto)}
                    </span>
                    <form action={borrarMovimiento.bind(null, m.id)}>
                        <button aria-label="Borrar" className="text-neutral-400 hover:text-red-600">
                            <Trash2 size={16} />
                        </button>
                    </form>
                </li>
            ))}
        </ul>
    );
}