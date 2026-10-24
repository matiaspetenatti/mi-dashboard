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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 px-1 text-xs text-neutral-500">
      <div className="flex items-center gap-2">
        <p>
          Mostrando{" "}
          <span className="font-semibold text-neutral-800">{desde}</span> a{" "}
          <span className="font-semibold text-neutral-800">{hasta}</span> de{" "}
          <span className="font-semibold text-neutral-800">{total}</span> animes
        </p>
        {cargando && <Loader2 size={13} className="animate-spin text-neutral-400" />}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onCambiarPagina(pagina - 1)}
            disabled={pagina <= 1 || cargando}
            className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-xs transition hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none"
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
                    className="px-1 text-neutral-400"
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
                  className={`min-w-7 h-7 rounded-lg text-xs font-medium transition ${
                    activa
                      ? "bg-neutral-900 text-white shadow-xs font-semibold"
                      : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50"
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
            className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-xs transition hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>Siguiente</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
