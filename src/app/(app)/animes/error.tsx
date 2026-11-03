"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AnimesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-outline-variant/50 bg-card px-6 py-12 text-center">
      <p className="text-sm font-medium text-on-error-container">
        Ocurrió un error al cargar el módulo de Animes.
      </p>
      <div className="flex gap-2">
        <button
          onClick={reset}
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-on-primary hover:bg-primary/90"
        >
          Reintentar
        </button>
        <Link
          href="/animes"
          className="rounded-full border border-outline-variant/60 bg-card px-4 py-1.5 text-sm font-medium text-charcoal hover:bg-surface-container"
        >
          Volver
        </Link>
      </div>
    </div>
  );
}