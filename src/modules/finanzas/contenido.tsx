import {
  getCuentas,
  getMovimientosPaginados,
  getEvolucionPatrimonio,
  getComparativaServicios,
} from "./queries";
import { ResumenMes, ResumenSkeleton } from "./resumen-mes";
import { EvolucionPatrimonioChart } from "./evolucion-patrimonio";
import { ComparadorServicios } from "./comparador-servicios";
import { CuentasSection } from "./cuentas-section";
import { OperacionesForm } from "./operaciones-form";
import { ListaMovimientos } from "./lista-movimientos";
import { Suspense } from "react";

export function FinanzasSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <ResumenSkeleton />
      <div className="h-72 rounded-xl bg-neutral-100" />
      <div className="h-44 rounded-xl bg-neutral-100" />
      <div className="h-36 rounded-xl bg-neutral-100" />
      <div className="h-44 rounded-xl bg-neutral-100" />
    </div>
  );
}

export async function FinanzasContenido() {
  const [cuentas, movimientosData, evolucionPatrimonio, comparativaServicios] =
    await Promise.all([
      getCuentas(),
      getMovimientosPaginados({
        pagina: 1,
        limite: 10,
        ocultarRendimientos: true,
      }),
      getEvolucionPatrimonio(),
      getComparativaServicios(),
    ]);

  return (
    <div className="space-y-6">
      <Suspense fallback={<ResumenSkeleton />}>
        <ResumenMes />
      </Suspense>

      {/* Gráfico de evolución del patrimonio (1M, 3M, 6M, 1A) */}
      <EvolucionPatrimonioChart puntos={evolucionPatrimonio} />

      {/* Comparador de gastos en servicios: mes anterior vs actual */}
      <ComparadorServicios datos={comparativaServicios} />

      {/* Cuentas y rendimientos */}
      <CuentasSection cuentas={cuentas} />

      {/* Movimientos: Formulario y Lista Paginada */}
      <div className="space-y-4 pt-2">
        <h2 className="text-lg font-semibold text-neutral-900">
          Historial de Movimientos
        </h2>
        <OperacionesForm cuentas={cuentas} />
        <ListaMovimientos initialData={movimientosData} cuentas={cuentas} />
      </div>
    </div>
  );
}
