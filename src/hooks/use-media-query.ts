"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Devuelve true cuando la media query se cumple en el cliente.
 * En el servidor siempre devuelve false para evitar desajustes de hidratación.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
