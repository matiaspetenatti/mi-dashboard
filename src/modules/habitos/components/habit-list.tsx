"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import type { Habito } from "@/modules/habitos/schema";
import { HabitCard } from "@/modules/habitos/components/habit-card";

interface HabitListProps {
  habitos: Habito[];
  registrosHoy: Record<number, boolean>;
  onToggle: (habitoId: number, completado: boolean) => Promise<void>;
  onEditar?: (habito: Habito) => void;
  onEliminar?: (id: number) => void;
  onVerDetalle?: (habito: Habito) => void;
  onAgregar?: () => void;
}

export function HabitList({
  habitos,
  registrosHoy,
  onToggle,
  onEditar,
  onEliminar,
  onVerDetalle,
  onAgregar,
}: HabitListProps) {
  const [habitoEliminando, setHabitoEliminando] = useState<number | null>(null);

  const manejarToggle = useCallback(
    async (habito: Habito, completadoActual: boolean) => {
      await onToggle(habito.id, !completadoActual);
    },
    [onToggle],
  );

  const manejarEditar = (h: Habito) => {
    onEditar?.(h);
  };

  const manejarEliminarBtn = (id: number) => {
    onEliminar?.(id);
  };

  if (habitos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-outline-variant/70 bg-surface-bright p-12 text-center">
        <Plus size={24} className="text-primary" />
        <h3 className="text-sm font-semibold text-charcoal">
          Sin hábitos todavía
        </h3>
        <p className="text-xs text-on-surface-variant">
          Creá tu primer hábito para comenzar a trackear.
        </p>
        {onAgregar && (
          <button
            onClick={onAgregar}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-on-primary transition-colors hover:bg-primary/90"
          >
            <Plus size={14} />
            Agregar hábito
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {habitos.map((habito) => {
        const completadoHoy = Boolean(registrosHoy[habito.id]);
        return (
          <HabitCard
            key={habito.id}
            habito={habito}
            registros={[]}
            rachaActual={0}
            rachaMaxima={0}
            completadoHoy={completadoHoy}
            onToggle={(siguiente) =>
              manejarToggle(habito, completadoHoy).then(() => siguiente)
            }
            onEditar={manejarEditar}
            onEliminar={manejarEliminarBtn}
            onVerDetalle={onVerDetalle}
          />
        );
      })}
    </div>
  );
}
