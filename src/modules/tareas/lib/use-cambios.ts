"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { EstadoProyecto, Etiqueta } from "@/modules/tareas/schema";
import type { TareaConDetalle } from "@/modules/tareas/queries/tareas";
import {
  aplicarCambiosTareas,
  type CambioTarea,
  type CambiosTareas,
} from "./optimista";

/**
 * Mantiene cambios locales (por ejemplo, marcar una tarea como hecha)
 * hasta que el servidor devuelve los datos actualizados.
 */
export function useCambiosOptimistas(
  tareas: TareaConDetalle[],
  estados: EstadoProyecto[],
  etiquetas: Etiqueta[],
) {
  const [cambios, setCambios] = useState<CambiosTareas>({});

  const visibles = useMemo(
    () => aplicarCambiosTareas(tareas, cambios, estados, etiquetas),
    [tareas, cambios, estados, etiquetas],
  );

  const aplicar = useCallback((id: number, cambio: CambioTarea) => {
    setCambios((previo) => ({
      ...previo,
      [id]: { ...previo[id], ...cambio },
    }));
  }, []);

  const descartar = useCallback((id: number) => {
    setCambios((previo) => {
      if (!(id in previo)) return previo;
      const siguiente = { ...previo };
      delete siguiente[id];
      return siguiente;
    });
  }, []);

  return { tareas: visibles, aplicar, descartar };
}

/**
 * Agrupa los `router.refresh()` seguidos: la pantalla ya quedó actualizada
 * de forma optimista, así que no hace falta ir al servidor en cada cambio.
 */
export function useRefrescoDiferido() {
  const router = useRouter();
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  const programar = useCallback(
    (espera = 900) => {
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => {
        temporizador.current = null;
        router.refresh();
      }, espera);
    },
    [router],
  );

  const inmediato = useCallback(() => {
    if (temporizador.current) {
      clearTimeout(temporizador.current);
      temporizador.current = null;
    }
    router.refresh();
  }, [router]);

  return { programar, inmediato };
}
