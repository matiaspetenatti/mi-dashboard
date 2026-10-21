import { Suspense } from "react";
import { crearMovimiento } from "@/modules/finanzas/actions";
import { categorias } from "@/modules/finanzas/categorias";
import { ResumenMes, ResumenSkeleton } from "@/modules/finanzas/resumen-mes";
import { ListaMovimientos } from "@/modules/finanzas/lista-movimientos";

const input = "rounded-md border px-3 py-2 text-sm";

export default function FinanzasPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Finanzas</h1>

      <Suspense fallback={<ResumenSkeleton />}>
        <ResumenMes />
      </Suspense>

      <form action={crearMovimiento} className="flex flex-wrap gap-2">
        <select name="tipo" className={input} defaultValue="gasto">
          <option value="gasto">Gasto</option>
          <option value="ingreso">Ingreso</option>
        </select>
        <input
          name="monto"
          inputMode="decimal"
          placeholder="Monto (ej: 1500,50)"
          required
          className={`${input} w-44`}
        />
        <select name="categoria" className={input}>
          {categorias.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input name="descripcion" placeholder="Descripción (opcional)" className={`${input} flex-1 min-w-40`} />
        <input type="date" name="fecha" className={input} />
        <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white">Agregar</button>
      </form>

      <Suspense fallback={<p className="text-sm text-neutral-500">Cargando movimientos...</p>}>
        <ListaMovimientos />
      </Suspense>
    </div>
  );
}