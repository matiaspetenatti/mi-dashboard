"use client";

import { Check } from "lucide-react";
import { cn } from "cn";

export function Checkbox({
  checked,
  onChange,
  ariaLabel = "Completar",
  className,
}: {
  checked: boolean;
  onChange: () => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={(event) => {
        event.stopPropagation();
        onChange();
      }}
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
        checked
          ? "border-primary bg-primary text-on-primary"
          : "border-outline-variant bg-transparent text-transparent hover:border-primary/70",
        className,
      )}
    >
      <Check size={13} strokeWidth={3} />
    </button>
  );
}
