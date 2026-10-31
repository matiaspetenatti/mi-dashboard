"use client";

import { useEffect, useState } from "react";
import { GitBranch, RefreshCw, Loader2 } from "lucide-react";
import { sincronizarActividadGitHub } from "@/modules/habitos/lib/github";

interface GithubActivityProps {
  dias: Array<{ fecha: string; commits: number; pullRequests: number; issues: number }>;
  totalCommits: number;
}

export function GithubActivity({
  dias,
  totalCommits,
}: GithubActivityProps) {
  const [sincronizando, setSincronizando] = useState(false);
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState<string | null>(null);

  const sincronizar = async () => {
    setSincronizando(true);
    try {
      const resultado = await sincronizarActividadGitHub();
      if (resultado.ok) {
        setUltimaSincronizacion(new Date().toLocaleString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }));
      }
    } finally {
      setSincronizando(false);
    }
  };

  useEffect(() => {
    // Sincronizar al montar si no hay datos
    if (!dias?.length) {
      sincronizar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const diasConActividad = dias.filter((d) => d.commits > 0 || d.pullRequests > 0 || d.issues > 0);

  return (
    <div className="rounded-[20px] border border-outline-variant/60 bg-card p-4 shadow-elevation-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-container-low text-charcoal">
            <GitBranch size={17} />
          </div>
          <h3 className="text-sm font-bold text-charcoal">GitHub</h3>
        </div>
        <button
          onClick={sincronizar}
          disabled={sincronizando}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors bg-surface-container-low text-charcoal hover:bg-surface-container disabled:opacity-50"
        >
          {sincronizando ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          Actualizar
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-wider text-pebble">Commits (30 días)</p>
          <p className="text-2xl font-bold tabular-nums text-charcoal">{totalCommits}</p>
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-wider text-pebble">Días con actividad</p>
          <p className="text-2xl font-bold tabular-nums text-charcoal">{diasConActividad.length}</p>
        </div>
      </div>

      {dias.length === 0 && !sincronizando && (
        <div className="mt-4 flex flex-col items-center justify-center gap-1 rounded-lg p-4 text-center">
          <p className="text-xs text-on-surface-variant">
            Sin actividad de GitHub reciente
          </p>
          <p className="text-[10px] text-on-surface-variant/70">
            Sincronizá para ver commits de matiaspetenatti
          </p>
        </div>
      )}

      {ultimaSincronizacion && (
        <p className="mt-3 text-[10px] text-on-surface-variant/70 text-right">
          Última sincronización: {ultimaSincronizacion}
        </p>
      )}
    </div>
  );
}
