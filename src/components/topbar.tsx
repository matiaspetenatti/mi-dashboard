"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Plus, Timer } from "lucide-react";
import { modules } from "@/lib/modules";

function moduloActual(pathname: string) {
  return modules.find((modulo) =>
    modulo.href === "/" ? pathname === "/" : pathname.startsWith(modulo.href),
  );
}

const claseRegistrar =
  "inline-flex items-center gap-1.5 rounded-full bg-lime-voltage px-4 py-1.5 text-sm font-bold text-forest-ink transition-[filter] duration-200 hover:brightness-105 active:scale-[0.98] dark:shadow-[0_0_12px_rgba(159,232,112,0.25)]";

export function Topbar() {
  const pathname = usePathname();
  const actual = moduloActual(pathname);
  const enFinanzas = pathname.startsWith("/finanzas");

  // En Finanzas el CTA lleva al formulario de movimientos que ya está en la página:
  // avisa a la sección para que vuelva a la pestaña "Movimiento", scrollea y enfoca el monto.
  const registrarActividad = () => {
    window.dispatchEvent(new Event("finanzas:nuevo-movimiento"));

    const formulario = document.getElementById("nuevo-movimiento");
    if (!formulario) return;

    formulario.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      document.getElementById("campo-monto")?.focus({ preventScroll: true });
    }, 400);
  };

  return (
    <header className="sticky top-0 z-30 hidden h-16 shrink-0 items-center justify-between gap-4 border-b border-outline-variant/50 bg-surface/90 px-8 backdrop-blur-md md:flex">
      <div className="flex min-w-0 items-center gap-2.5">
        <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-lime-voltage" />
        <p className="truncate text-sm font-semibold text-heading">
          {actual?.label ?? "Mi dashboard"}
        </p>
        <span className="hidden text-xs text-on-surface-variant lg:inline">
          · Tu día, en orden
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/estudio"
          className="inline-flex items-center gap-1.5 rounded-full border border-primary px-4 py-1.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-surface-container dark:border-outline-variant dark:bg-surface-container-low dark:text-charcoal dark:hover:bg-surface-container-high dark:hover:text-heading"
        >
          <Timer size={15} />
          Modo Enfoque
        </Link>

        {enFinanzas ? (
          <button
            type="button"
            onClick={registrarActividad}
            className={claseRegistrar}
          >
            <Plus size={15} />
            Registrar Actividad
          </button>
        ) : (
          <Link href="/finanzas" className={claseRegistrar}>
            <Plus size={15} />
            Registrar Actividad
          </Link>
        )}

        <span aria-hidden="true" className="mx-1 h-6 w-px bg-outline-variant" />

        <UserButton
          appearance={{ elements: { avatarBox: "size-9" } }}
          showName={false}
        />
      </div>
    </header>
  );
}
