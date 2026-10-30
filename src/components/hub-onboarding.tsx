"use client";

import { useSyncExternalStore } from "react";
import { Sparkles, X } from "lucide-react";

const VISTO_KEY = "md:hub-onboarding-visto";
const CAMBIO_KEY = "md:hub-onboarding-cambio";

function getVisto(): boolean {
  return (
    typeof window !== "undefined" && localStorage.getItem(VISTO_KEY) === "1"
  );
}

function suscribir(alCambiar: () => void) {
  window.addEventListener("storage", alCambiar);
  window.addEventListener(CAMBIO_KEY, alCambiar);

  return () => {
    window.removeEventListener("storage", alCambiar);
    window.removeEventListener(CAMBIO_KEY, alCambiar);
  };
}

export function HubOnboarding() {
  const visto = useSyncExternalStore(suscribir, getVisto, () => true);

  if (visto) return null;

  const descartar = () => {
    try {
      localStorage.setItem(VISTO_KEY, "1");
    } catch {
      // Sin storage igual ocultamos el aviso en esta sesión.
    }
    window.dispatchEvent(new Event(CAMBIO_KEY));
  };

  return (
    <section className="flex flex-wrap items-center gap-3 rounded-[16px] border border-outline-variant/60 bg-linen-mist px-4 py-3 text-forest-ink dark:bg-surface-container dark:text-on-surface">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-card text-primary">
        <Sparkles size={16} />
      </span>

      <p className="min-w-0 flex-1 text-xs leading-relaxed">
        Esto es tu hub: un vistazo a tus tareas, finanzas, estudio, clima y
        animes. Usá el sidebar para entrar a cada módulo.
      </p>

      <button
        type="button"
        onClick={descartar}
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-forest-ink/30 px-3 py-1 text-[11px] font-bold transition-colors hover:bg-forest-ink/10 dark:border-outline-variant dark:hover:bg-white/10"
      >
        <X size={12} />
        Entendido
      </button>
    </section>
  );
}
