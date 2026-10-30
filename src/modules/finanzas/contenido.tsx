import { Suspense } from "react";
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
import { SeccionMovimientos } from "./seccion-movimientos";

export function FinanzasSkeleton() {
  return (
    <div className="animate-pulse space-y-7">
      <ResumenSkeleton />
      <div className="h-80 rounded-xl border border-outline-variant/40 bg-surface-container/60" />
      <div className="h-72 rounded-xl border border-outline-variant/40 bg-surface-container/60" />
      <div className="h-56 rounded-xl border border-outline-variant/40 bg-surface-container/60" />
      <div className="h-72 rounded-xl border border-outline-variant/40 bg-surface-container/60" />
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
    <div className="space-y-7">
      <Suspense fallback={<ResumenSkeleton />}>
        <ResumenMes />
      </Suspense>

      {/* Evolución del patrimonio (1 mes, 3, 6 y 1 año) */}
      <EvolucionPatrimonioChart puntos={evolucionPatrimonio} />

      {/* Comparador de gastos en servicios: mes anterior vs actual */}
      <ComparadorServicios datos={comparativaServicios} />

      {/* Cuentas y rendimientos */}
      <CuentasSection cuentas={cuentas} />

      {/* Movimientos: acciones, formulario y lista paginada */}
      <SeccionMovimientos
        cuentas={cuentas}
        movimientosIniciales={movimientosData}
      />
    </div>
  );
}
