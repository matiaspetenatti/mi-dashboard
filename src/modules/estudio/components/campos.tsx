import type { ReactNode } from "react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const claseSelect =
  "h-11 w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 text-sm text-on-surface outline-none transition-all duration-200 hover:border-outline focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50";

export function SelectEstudio({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select className={cn(claseSelect, className)} {...props}>
      {children}
    </select>
  );
}

export function Campo({
  etiqueta,
  ayuda,
  className,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <Label>{etiqueta}</Label>
      {children}
      {ayuda && (
        <span className="block text-[11px] text-on-surface-variant/80">
          {ayuda}
        </span>
      )}
    </label>
  );
}

export { Input, Textarea };
