"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue, useReducedMotion } from "motion/react";

export type CountUpFormat = "integer" | "ars";

type CountUpProps = {
  value: number;
  format?: CountUpFormat;
  duration?: number;
  className?: string;
};

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

const integerFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
});

function formatValue(value: number, format: CountUpFormat) {
  if (format === "ars") {
    return arsFormatter.format(value / 100);
  }

  return integerFormatter.format(Math.round(value));
}

export function CountUp({
  value,
  format = "integer",
  duration = 0.9,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  const label = formatValue(value, format);

  useEffect(() => {
    if (!ref.current) return;

    if (reduceMotion) {
      ref.current.textContent = formatValue(value, format);
      return;
    }

    const controls = animate(motionValue, value, {
      duration,
      ease: [0.2, 0, 0, 1],
      onUpdate: (latest) => {
        if (ref.current) {
          ref.current.textContent = formatValue(latest, format);
        }
      },
    });

    return () => controls.stop();
  }, [duration, format, motionValue, reduceMotion, value]);

  return (
    <span ref={ref} className={className} aria-label={label}>
      {formatValue(0, format)}
    </span>
  );
}
