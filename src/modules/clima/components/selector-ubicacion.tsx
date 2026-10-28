"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { cn } from "cn";
import { useToast } from "@/hooks/use-toast";
import { activarUbicacionClima } from "@/modules/clima/actions";
import type { UbicacionClima } from "@/modules/clima/types";

type Props = {
  ubicaciones: UbicacionClima[];
  activa: UbicacionClima;
};

/**
 * Chips de un clic para cambiar la ciudad activa.
 * La ubicación activa se resalta y el orden se mantiene estable (id asc).
 */
export function SelectorUbicacion({ ubicaciones, activa }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pendiente, startTransition] = useTransition();
  const [seleccion, setSeleccion] = useState({
    propId: activa.id,
    id: activa.id,
  });
  const [cambiandoId, setCambiandoId] = useState<number | null>(null);

  // Sincroniza la selección optimista cuando la ubicación activa llega del servidor.
  if (seleccion.propId !== activa.id) {
    setSeleccion({ propId: activa.id, id: activa.id });
  }
  const activaId = seleccion.id;

  // Sin ubicaciones guardadas mostramos la de respaldo como referencia.
  const lista = ubicaciones.length > 0 ? ubicaciones : [activa];

  function cambiar(ubicacion: UbicacionClima) {
    if (ubicacion.id === null || ubicacion.id === activaId) return;

    const anterior = activaId;
    setSeleccion({ propId: activa.id, id: ubicacion.id });
    setCambiandoId(ubicacion.id);

    startTransition(async () => {
      const resultado = await activarUbicacionClima(ubicacion.id as number);
      setCambiandoId(null);

      if (!resultado.ok) {
        setSeleccion({ propId: activa.id, id: anterior });
        toast.error(resultado.error);
        return;
      }

      toast.success("Ubicación cambiada", {
        description: ubicacion.etiqueta,
      });
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label="Cambiar ubicación del clima"
      className="flex flex-wrap items-center gap-1.5"
    >
      {lista.map((ubicacion) => {
        const esActiva = ubicacion.id === activaId;
        const cargando = pendiente && cambiandoId === ubicacion.id;

        const contenido = (
          <>
            <MapPin
              aria-hidden="true"
              className={cn(
                "size-3 shrink-0",
                esActiva ? "text-primary" : "text-on-surface-variant",
              )}
            />
            <span className="max-w-[12rem] truncate">{ubicacion.etiqueta}</span>
          </>
        );

        if (ubicacion.id === null) {
          return (
            <span
              key={ubicacion.etiqueta}
              aria-current="true"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary-container px-3 py-1.5 text-xs font-medium text-on-primary-container"
            >
              {contenido}
            </span>
          );
        }

        return (
          <button
            key={ubicacion.id}
            type="button"
            onClick={() => cambiar(ubicacion)}
            aria-pressed={esActiva}
            aria-busy={cargando || undefined}
            disabled={pendiente}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-70",
              esActiva
                ? "border-primary/40 bg-primary-container text-on-primary-container"
                : "border-outline-variant/50 bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
            )}
          >
            {contenido}
          </button>
        );
      })}
    </div>
  );
}
