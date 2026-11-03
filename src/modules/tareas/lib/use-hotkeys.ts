"use client";

import { useEffect } from "react";

type Atajo = {
  tecla: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (e: KeyboardEvent) => void;
  cuando?: () => boolean;
};

export function useHotkeys(atajos: Atajo[]) {
  useEffect(() => {
    function alTeclar(evento: KeyboardEvent) {
      const objetivo = evento.target as HTMLElement | null;
      const enInput =
        objetivo &&
        (objetivo.tagName === "INPUT" ||
          objetivo.tagName === "TEXTAREA" ||
          objetivo.isContentEditable);
      for (const atajo of atajos) {
        if (atajo.cuando && !atajo.cuando()) continue;
        const teclaOk = evento.key.toLowerCase() === atajo.tecla.toLowerCase();
        const ctrlOk = !!atajo.ctrl === (evento.ctrlKey || evento.metaKey);
        const shiftOk = !!atajo.shift === evento.shiftKey;
        const altOk = !!atajo.alt === evento.altKey;
        if (teclaOk && ctrlOk && shiftOk && altOk) {
          if (enInput && !atajo.ctrl && !atajo.alt) continue;
          evento.preventDefault();
          atajo.handler(evento);
          return;
        }
      }
    }
    window.addEventListener("keydown", alTeclar);
    return () => window.removeEventListener("keydown", alTeclar);
  }, [atajos]);
}