"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { PaginacionAnimes as Paginacion } from "@/modules/animes/schema";

function generarPaginasVisibles(
  actual: number,
  total: number,
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (actual <= 3) {
    return [1, 2, 3, 4, "...", total];
  }
  if (actual >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }
  return [1, "...", actual - 1, actual, actual + 1, "...", total];
}

export function PaginacionAnimes({
  paginacion,
  cargando,
  onCambiarPagina,
}: {
  paginacion: Paginacion;
  cargando?: boolean;
  onCambiarPagina: (pagina: number) => void;
}) {
  const { total, pagina, limite, totalPaginas } = paginacion;

  if (total === 0) return null;

  const paginasVisibles = generarPaginasVisibles(pagina, totalPaginas);
  const desde = (pagina - 1) * limite + 1;
  const hasta = Math.min(pagina * limite, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-1 pt-1 text-xs text-on-surface-variant sm:flex-row">
      <div className="flex items-center gap-2">
        <p>
          Mostrando{" "}
          <span className="font-semibold text-charcoal">{desde}</span> a{" "}
          <span className="font-semibold text-charcoal">{hasta}</span> de{" "}
          <span className="font-semibold text-charcoal">{total}</span> animes
        </p>
        {cargando && <Loader2 size={13} className="animate-spin text-primary" />}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onCambiarPagina(pagina - 1)}
            disabled={pagina <= 1 || cargando}
            className="flex items-center gap-1 rounded-full border border-outline-variant/60 bg-card px-3 py-1 text-xs font-semibold text-charcoal transition hover:bg-surface-container disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft size={14} />
            <span>Anterior</span>
          </button>

          <div className="flex items-center gap-1 px-1">
            {paginasVisibles.map((p, idx) => {
              if (p === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1 text-pebble"
                  >
                    …
                  </span>
                );
              }

              const activa = p === pagina;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onCambiarPagina(p)}
                  disabled={cargando}
                  aria-current={activa ? "page" : undefined}
                  className={`h-7 min-w-7 rounded-full px-2 text-xs transition ${
                    activa
                      ? "bg-inverse-surface font-semibold text-inverse-on-surface"
                      : "border border-outline-variant/60 bg-card text-charcoal hover:bg-surface-container"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onCambiarPagina(pagina + 1)}
            disabled={pagina >= totalPaginas || cargando}
            className="flex items-center gap-1 rounded-full border border-outline-variant/60 bg-card px-3 py-1 text-xs font-semibold text-charcoal transition hover:bg-surface-container disabled:pointer-events-none disabled:opacity-40"
          >
            <span>Siguiente</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
