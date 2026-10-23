"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fechaHoy } from "@/lib/format";

const STORAGE_KEY = "finanzas:ultima-sincronizacion";

let ultimaSincronizacionEnMemoria: string | null = null;
let sincronizacionEnCurso = false;

/**
 * Dispara la reconciliación diaria de rendimientos sin bloquear el render.
 *
 * El repo no tiene cron configurado, así que usamos un chequeo por cliente:
 * una vez por día (por navegador) llamamos al endpoint y refrescamos la ruta.
 * Es idempotente: el endpoint evita duplicar rendimientos por fecha.
 */
export function SincronizacionDiariaFinanzas() {
  const router = useRouter();

  useEffect(() => {
    const hoy = fechaHoy();

    if (ultimaSincronizacionEnMemoria === hoy) return;

    try {
      if (localStorage.getItem(STORAGE_KEY) === hoy) {
        ultimaSincronizacionEnMemoria = hoy;
        return;
      }
    } catch {
      // localStorage puede no estar disponible; seguimos con la guarda en memoria.
    }

    if (sincronizacionEnCurso) return;
    sincronizacionEnCurso = true;

    const sincronizar = async () => {
      try {
        const response = await fetch("/api/finanzas/rendimientos", {
          method: "POST",
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = (await response.json()) as { ok?: boolean };
        if (!data.ok) return;

        ultimaSincronizacionEnMemoria = hoy;
        try {
          localStorage.setItem(STORAGE_KEY, hoy);
        } catch {
          // Si no se puede persistir, la guarda en memoria evita repetirlo en esta sesión.
        }

        router.refresh();
      } catch (error) {
        console.error("Error al sincronizar rendimientos diarios:", error);
      } finally {
        sincronizacionEnCurso = false;
      }
    };

    void sincronizar();
  }, [router]);

  return null;
}
