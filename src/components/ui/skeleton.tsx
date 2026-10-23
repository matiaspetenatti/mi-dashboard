import * as React from "react";
import { cn } from "cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-2xl bg-surface-container-high",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.6s_infinite] after:bg-linear-to-r after:from-transparent after:via-white/55 after:to-transparent dark:after:via-white/10",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
