"use client";

import { useEffect, useState, useTransition } from "react";
import { Calendar, Check, Edit3, Film, Loader2, Minus, Plus, RotateCcw, Star, X } from "lucide-react";
import { actualizarProgresoAnime } from "@/modules/animes/actions/progreso";
import { ModalEditarAnime } from "@/modules/animes/components/modal/editar";
import { DesglosePuntaje } from "@/modules/animes/components/desglose-puntaje";
import type { AnimeVisto } from "@/modules/animes/schema";
import { puntajeMostrable } from "@/modules/animes/lib/criterios";

const estadoLabel: Record<string, string> = {
  viendo: "Viendo",
  completado: "Completado",
  en_pausa: "En pausa",
  abandonado: "Abandonado",
};

const estadoColor: Record<string, string> = {
  viendo: "bg-secondary-container text-on-secondary-container",
  completado: "bg-success-container text-on-success-container",
  en_pausa: "bg-warning-container text-on-warning-container",
  abandonado: "bg-surface-container text-on-surface-variant",
};

export function ModalDetalleAnime({
  open,
  onClose,
  anime,
  cargandoDescripcion = false,
  onActualizar,
  onEliminado,
}: {
  open: boolean;
  onClose: () => void;
  anime: AnimeVisto;
  cargandoDescripcion?: boolean;
  onActualizar?: (cambios: Partial<AnimeVisto> & { id: number }) => void;
  onEliminado?: (id: number) => void;
}) {
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const descripcion = anime.descripcion || null;
  const [vistos, setVistos] = useState(anime.episodiosVistos || 0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const generos = Array.isArray(anime.generos) ? anime.generos : [];
  const titulo = anime.tituloIngles || anime.titulo;
  const total = anime.episodios ?? null;
  const porcentaje = total && total > 0 ? Math.min(100, Math.round((vistos / total) * 100)) : 0;
  const miPuntaje = puntajeMostrable(anime);

  useEffect(() => {
    if (!open || mostrarEditar) return;
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [open, mostrarEditar, onClose]);

  const guardarProgreso = (siguiente: number) => {
    const anterior = vistos;
    const nuevo = total ? Math.max(0, Math.min(siguiente, total)) : Math.max(0, siguiente);
    if (nuevo === anterior) return;

    setError(null);
    setVistos(nuevo);
    onActualizar?.({ id: anime.id, episodiosVistos: nuevo });

    startTransition(async () => {
      const res = await actualizarProgresoAnime(anime.id, nuevo);
      if (res?.error) {
        setError(res.error);
        setVistos(anterior);
        onActualizar?.({ id: anime.id, episodiosVistos: anterior });
      }
    });
  };

  const alEditar = (cambios: Partial<AnimeVisto> & { id: number }) => {
    onActualizar?.(cambios);
    if (typeof cambios.episodiosVistos === "number") setVistos(cambios.episodiosVistos);
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]"
        onClick={onClose}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle de ${titulo}`}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-outline-variant/60 bg-surface-container-lowest text-on-surface shadow-elevation-4"
        >
          <div className="flex items-start justify-between gap-3 border-b border-outline-variant/40 px-5 py-4">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold tracking-tight">{titulo}</h3>
              {anime.tituloIngles && anime.tituloIngles !== anime.titulo && (
                <p className="truncate text-xs text-on-surface-variant">{anime.titulo}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="grid size-8 shrink-0 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <div className="grid gap-5 sm:grid-cols-[190px_1fr]">
              <img
                src={anime.imagen}
                alt={titulo}
                className="h-[270px] w-full rounded-xl object-cover shadow-elevation-1 sm:w-[190px]"
              />

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {anime.estado && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        estadoColor[anime.estado] || "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {estadoLabel[anime.estado] || anime.estado}
                    </span>
                  )}
                  {anime.tipo && (
                    <span className="flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 text-[11px] text-charcoal">
                      <Film size={11} />
                      {anime.tipo}
                    </span>
                  )}
                  {anime.ano && (
                    <span className="flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 text-[11px] text-charcoal">
                      <Calendar size={11} />
                      {anime.ano}
                    </span>
                  )}
                  {anime.rewatch && (
                    <span className="flex items-center gap-1 rounded-full bg-tertiary-container px-2 py-0.5 text-[11px] text-on-tertiary-container">
                      <RotateCcw size={11} />
                      Rewatch
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {miPuntaje !== null && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-pebble">Mi puntaje</p>
                      <p className="flex items-center gap-1 text-lg font-semibold tabular-nums text-charcoal">
                        <Star size={16} className="text-warning" fill="currentColor" />
                        {miPuntaje}
                        <span className="text-xs font-normal text-pebble">/ 100</span>
                      </p>
                    </div>
                  )}
                  {anime.scoreMal !== null && anime.scoreMal !== undefined && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-pebble">Score MAL</p>
                      <p className="flex items-center gap-1 text-lg font-semibold tabular-nums text-charcoal">
                        <Star size={14} />
                        {anime.scoreMal.toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-pebble">Episodios</p>
                    <p className="text-lg font-semibold tabular-nums text-charcoal">
                      {vistos}
                      {total ? <span className="text-xs font-normal text-pebble"> / {total}</span> : null}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-charcoal">Progreso de episodios</h4>
                <span className="text-xs font-medium tabular-nums text-on-surface-variant">
                  {vistos}
                  {total ? ` / ${total}` : ""} vistos
                </span>
              </div>

              {total ? (
                <div className="h-2 w-full rounded-full bg-surface-container-high">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              ) : null}
            </div>

            <DesglosePuntaje anime={anime} />

            <div>
              <h4 className="mb-1 text-sm font-semibold text-charcoal">Sinopsis</h4>
              {descripcion ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-on-surface-variant">
                  {descripcion}
                </p>
              ) : cargandoDescripcion ? (
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <Loader2 size={14} className="animate-spin text-primary" />
                  Buscando descripción...
                </div>
              ) : (
                <p className="text-sm text-pebble">
                  Sin descripción disponible.
                </p>
              )}
            </div>

            {anime.notas && (
              <div>
                <h4 className="mb-1 text-sm font-semibold text-charcoal">
                  Mis notas
                </h4>
                <p className="whitespace-pre-line rounded-lg bg-surface-container-low p-3 text-sm text-on-surface-variant">
                  {anime.notas}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-outline-variant/40 bg-surface-container-lowest px-5 py-3">
            <button
              onClick={onClose}
              className="rounded-full border border-outline-variant/60 bg-card px-4 py-1.5 text-sm font-medium text-charcoal transition-colors hover:bg-surface-container"
            >
              Cerrar
            </button>
            <button
              onClick={() => setMostrarEditar(true)}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90"
            >
              <Edit3 size={14} />
              Editar
            </button>
          </div>
        </div>
      </div>

      {mostrarEditar && (
        <ModalEditarAnime
          open
          onClose={() => setMostrarEditar(false)}
          anime={anime}
          onActualizado={alEditar}
          onEliminado={(id) => {
            onEliminado?.(id);
            onClose();
          }}
        />
      )}
    </>
  );
}
