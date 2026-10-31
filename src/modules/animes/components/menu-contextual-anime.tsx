"use client";

import { useEffect, useRef, useState } from "react";
import { Edit3, Minus, Plus } from "lucide-react";
import { actualizarProgresoAnime } from "@/modules/animes/actions/progreso";
import { useToast } from "@/hooks/use-toast";
import type { AnimeVisto } from "@/modules/animes/schema";

interface MenuContextualAnimeProps {
  anime: AnimeVisto;
  open: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onActualizar: (cambios: { id: number; episodiosVistos: number }) => void;
  onEditar?: () => void;
}

export function MenuContextualAnime({
  anime,
  open,
  x,
  y,
  onClose,
  onActualizar,
  onEditar,
}: MenuContextualAnimeProps) {
  const toast = useToast();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isPending, setIsPending] = useState(false);
  const [pos, setPos] = useState({ x, y });
  const [medido, setMedido] = useState(false);

  const total = anime.episodios ?? null;
  const vistos = anime.episodiosVistos || 0;

  const puedeSumar = total === null || vistos < total;
  const puedeRestar = vistos > 0;

  // Ajusta la posición para que el menú no se salga del viewport tras medirlo.
  useEffect(() => {
    if (!open || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const offset = 8;
    let nx = x;
    let ny = y;
    if (nx + rect.width > window.innerWidth)
      nx = window.innerWidth - rect.width - offset;
    if (nx < offset) nx = offset;
    if (ny + rect.height > window.innerHeight)
      ny = window.innerHeight - rect.height - offset;
    if (ny < offset) ny = offset;
    setPos({ x: nx, y: ny });
    setMedido(true);
  }, [open, x, y]);

  // Cierra al hacer click fuera o al presionar Esc.
  useEffect(() => {
    if (!open) return;
    const alClickFuera = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", alClickFuera);
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("mousedown", alClickFuera);
      document.removeEventListener("keydown", alTecla);
    };
  }, [open, onClose]);

  const calcularSiguiente = (delta: number) => {
    const siguiente = Math.max(0, vistos + delta);
    return total !== null ? Math.min(siguiente, total) : siguiente;
  };

  const ejecutar = async (delta: number) => {
    if (isPending) return;
    const nuevo = calcularSiguiente(delta);
    if ((delta > 0 && !puedeSumar) || (delta < 0 && !puedeRestar)) return;

    setIsPending(true);
    onClose();

    // Actualización optimista en la galería.
    onActualizar({ id: anime.id, episodiosVistos: nuevo });

    try {
      const res = await actualizarProgresoAnime(anime.id, nuevo);
      if (res?.error) {
        // Revertir el cambio optimista si el servidor falla.
        onActualizar({ id: anime.id, episodiosVistos: vistos });
        toast.error("No se pudo actualizar el progreso", {
          description: res.error,
        });
      }
    } catch {
      onActualizar({ id: anime.id, episodiosVistos: vistos });
      toast.error("Error al actualizar el progreso del anime");
    } finally {
      setIsPending(false);
    }
  };

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      className={`fixed z-[60] ${medido ? "" : "opacity-0 pointer-events-none"}`}
      style={{
        left: pos.x,
        top: pos.y,
        minWidth: 200,
      }}
      role="menu"
    >
      <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-1.5 shadow-xl text-on-surface">
        {onEditar && (
          <button
            onClick={() => {
              onEditar();
              onClose();
            }}
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-left text-charcoal transition-colors hover:bg-surface-container hover:text-primary"
          >
            <Edit3 size={14} />
            Editar
          </button>
        )}
        <div className="-mx-1.5 my-0.5 h-px bg-outline-variant/40" />
        <button
          onClick={() => ejecutar(1)}
          disabled={!puedeSumar || isPending}
          role="menuitem"
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors ${
            !puedeSumar
              ? "text-pebble opacity-50"
              : isPending
                ? "text-pebble opacity-50 cursor-not-allowed"
                : "text-charcoal hover:bg-surface-container hover:text-primary"
          }`}
        >
          <Plus size={14} />
          {total !== null && vistos >= total
            ? "Episodios completados"
            : `Añadir episodio visto (${vistos + 1}/${total ?? "?"})`}
        </button>
        <button
          onClick={() => ejecutar(-1)}
          disabled={!puedeRestar || isPending}
          role="menuitem"
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors ${
            !puedeRestar
              ? "text-pebble opacity-50"
              : isPending
                ? "text-pebble opacity-50 cursor-not-allowed"
                : "text-charcoal hover:bg-surface-container hover:text-primary"
          }`}
        >
          <Minus size={14} />
          Restar episodio visto ({vistos - 1}/{total ?? "?"})
        </button>
      </div>
    </div>
  );
}
