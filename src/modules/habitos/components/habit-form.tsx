"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "cn";
import type { Habito } from "@/modules/habitos/schema";
import { TIPOS_HABITO, COLORES_HABITO } from "@/modules/habitos/constantes";
import { crearHabito, actualizarHabito } from "@/modules/habitos/actions";

interface HabitFormProps {
  open: boolean;
  habito?: Habito;
  onClose: () => void;
  onGuardado: () => void;
}

export function HabitForm({
  open,
  habito,
  onClose,
  onGuardado,
}: HabitFormProps) {
  const esEdicion = Boolean(habito);
  const [titulo, setTitulo] = useState(habito?.titulo || "");
  const [descripcion, setDescripcion] = useState(habito?.descripcion || "");
  const [tipo, setTipo] = useState<"bueno" | "malo">(habito?.tipo || "bueno");
  const [color, setColor] = useState(habito?.color || "#163300");
  const [emoji, setEmoji] = useState(habito?.emoji || "");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    setError(null);

    if (!titulo.trim()) {
      setError("El título es obligatorio");
      return;
    }

    setIsPending(true);

    try {
      const datos = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        tipo,
        color,
        emoji: emoji.trim() || null,
        frecuencia: "diaria" as const,
      };

      if (esEdicion && habito) {
        const res = await actualizarHabito(habito.id, datos);
        if (res.ok) {
          onGuardado();
          onClose();
        } else {
          setError(res.error);
        }
      } else {
        const res = await crearHabito(datos);
        if (res.ok) {
          onGuardado();
          onClose();
        } else {
          setError(res.error);
        }
      }
    } catch {
      setError("Error inesperado al guardar el hábito");
    } finally {
      setIsPending(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-w-md flex-col overflow-hidden rounded-3xl border border-outline-variant/60 bg-card shadow-elevation-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/40 px-5 py-4">
          <h3 className="text-lg font-bold text-heading">
            {esEdicion ? "Editar hábito" : "Nuevo hábito"}
          </h3>
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-on-surface-variant">
              Título
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Leer 20 páginas"
              className="w-full rounded-lg border border-outline-variant/60 bg-card px-3 py-2 text-sm text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-on-surface-variant">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="¿Qué querés lograr con este hábito?"
              rows={2}
              className="w-full resize-none rounded-lg border border-outline-variant/60 bg-card px-3 py-2 text-sm text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-on-surface-variant">
              Tipo de hábito
            </label>
            <div className="flex gap-1">
              {TIPOS_HABITO.map((t) => (
                <button
                  key={t.valor}
                  onClick={() => setTipo(t.valor)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                    tipo === t.valor
                      ? t.color
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container",
                  )}
                >
                  {t.etiqueta}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-on-surface-variant">
              Color
            </label>
            <div className="flex gap-1.5">
              {COLORES_HABITO.map((c) => (
                <button
                  key={c.valor}
                  onClick={() => setColor(c.valor)}
                  className={cn(
                    "size-7 rounded-full border transition-all hover:scale-110",
                    color === c.valor
                      ? "ring-2 ring-success ring-offset-1"
                      : "ring-1 ring-transparent",
                    `bg-[${c.valor}]`,
                  )}
                  title={c.etiqueta}
                  aria-label={c.etiqueta}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-on-surface-variant">
              Emoji (opcional)
            </label>
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="📚"
              maxLength={2}
              className="w-full rounded-lg border border-outline-variant/60 bg-card px-3 py-2 text-sm text-center transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-error-container px-3 py-2 text-xs text-on-error-container">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-outline-variant/40 px-5 py-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-full border border-outline-variant/60 bg-card px-4 py-1.5 text-sm font-medium text-charcoal transition-colors hover:bg-surface-container disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={isPending}
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "Guardando..." : esEdicion ? "Actualizar" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}
