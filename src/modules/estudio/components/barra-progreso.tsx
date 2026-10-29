import { cn } from "cn";

export function BarraProgreso({
  valor,
  color = "var(--color-tertiary)",
  className,
}: {
  valor: number;
  color?: string;
  className?: string;
}) {
  const porcentaje = Math.min(100, Math.max(0, valor));

  return (
    <div
      className={cn(
        "h-2 overflow-hidden rounded-full bg-surface-container",
        className,
      )}
      role="progressbar"
      aria-valuenow={porcentaje}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${porcentaje}%`, backgroundColor: color }}
      />
    </div>
  );
}
