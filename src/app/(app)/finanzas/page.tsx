import { Suspense } from "react";
import { FinanzasContenido, FinanzasSkeleton } from "@/modules/finanzas/contenido";
import { requireAuthorizedUser } from "@/lib/auth";

export default async function FinanzasPage() {
  await requireAuthorizedUser();

  return (
    <div className="space-y-7">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-wider text-pebble">
          Panel financiero
        </p>
        <h1 className="mt-0.5 text-4xl font-extrabold tracking-tight text-heading lg:text-5xl">
          Finanzas
        </h1>
        <p className="mt-1 max-w-xl text-sm text-charcoal">
          Patrimonio, gastos y movimientos de todas tus cuentas en un solo
          lugar.
        </p>
      </header>

      <Suspense fallback={<FinanzasSkeleton />}>
        <FinanzasContenido />
      </Suspense>
    </div>
  );
}
