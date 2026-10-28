"use client";

import { Check } from "lucide-react";
import { cn } from "cn";
import { paleta } from "@/modules/tareas/constantes";

export function SelectorColor({
  valor,
  onChange,
  className,
}: {
  valor: string;
  onChange: (color: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {paleta.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Color ${color}`}
          onClick={() => onChange(color)}
          className={cn(
            "grid size-7 place-items-center rounded-full ring-offset-2 ring-offset-surface-container-lowest transition-transform hover:scale-110",
            valor === color && "ring-2 ring-on-surface/50",
          )}
          style={{ backgroundColor: color }}
        >
          {valor === color && <Check size={13} className="text-white" />}
        </button>
      ))}
    </div>
  );
}
