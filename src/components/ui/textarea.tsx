import * as React from "react";
import { cn } from "cn";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full resize-y rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface transition-all duration-200 outline-none",
        "placeholder:text-on-surface-variant/60",
        "hover:border-outline",
        "focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
