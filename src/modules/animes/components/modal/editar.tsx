"use client";

import { useState, useTransition } from "react";
import { X, RefreshCw, Loader2 } from "lucide-react";
import {
  actualizarAnimeVisto,
  eliminarAnimeVisto,
} from "@/modules/animes/actions/actualizar";
import { actualizarAnimeDesdeApi } from "@/modules/animes/actions/actualizar-desde-api";
import { useToast } from "@/hooks/use-toast";
import type { AnimeVisto } from "@/modules/animes/schema";
import {
  CRITERIOS_ANIME,
  aColumnasPuntaje,
  calcularTotalPuntajes,
  extraerPuntajes,
  type CriterioAnimeKey,
  type PuntajesCriterios,
} from "@/modules/animes/lib/criterios";
import { PuntajeCriterios } from "@/modules/animes/components/puntaje-criterios";

export function ModalEditarAnime({
  open,
  onClose,
  anime,
  onActualizado,
  onEliminado,
}: {
  open: boolean;
  onClose: () => void;
  anime: AnimeVisto;
  onActualizado?: (cambios: Partial<AnimeVisto> & { id: number }) => void;
  onEliminado?: (id: number) => void;
}) {
  const [estado, setEstado] = useState<AnimeVisto["estado"]>(anime.estado);
  const [episodiosVistos, setEpisodiosVistos] = useState(anime.episodiosVistos?.toString() || "0");
  const [puntajes, setPuntajes] = useState<PuntajesCriterios>(() => extraerPuntajes(anime));
  const [notas, setNotas] = useState(anime.notas || "");
  const [rewatch, setRewatch] = useState(anime.rewatch);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isRefrescando, setIsRefrescando] = useState(false);
  const [datosMostrar, setDatosMostrar] = useState({
    titulo: anime.tituloIngles || anime.titulo,
    tipo: anime.tipo,
    ano: anime.ano,
    imagen: anime.imagen,
    generos: Array.isArray(anime.generos) ? anime.generos : [],
    descripcion: anime.descripcion,
    scoreMal: anime.scoreMal,
    episodios: anime.episodios,
  });
  const toast = useToast();

  if (!open) return null;

  const totalEpisodios =
    datosMostrar.episodios && datosMostrar.episodios > 0
      ? datosMostrar.episodios
      : null;

  const cambiarPuntaje = (criterio: CriterioAnimeKey, valor: number) => {
    setPuntajes((prev) => ({ ...prev, [criterio]: valor }));
  };

  const refrescarDesdeApi = async () => {
    setError(null);
    setIsRefrescando(true);

    try {
      const res = await actualizarAnimeDesdeApi(anime.id);

      if (res?.error) {
        setError(res.error);
        toast.error("No se pudo actualizar desde la API", {
          description: res.error,
        });
        return;
      }

      if (res?.success && res.cambios) {
        // Actualiza la UI del modal inmediatamente, sin esperar al padre.
        setDatosMostrar((prev) => ({
          ...prev,
          titulo: (res.cambios.tituloIngles ?? res.cambios.titulo) || prev.titulo,
          tipo: res.cambios.tipo ?? prev.tipo,
          ano: res.cambios.ano ?? prev.ano,
          imagen: res.cambios.imagen ?? prev.imagen,
          generos: res.cambios.generos ?? prev.generos,
          descripcion: res.cambios.descripcion ?? prev.descripcion,
          scoreMal: res.cambios.scoreMal ?? prev.scoreMal,
          episodios: res.cambios.episodios ?? prev.episodios,
        }));

        // Notificar al padre para que refresque la galería.
        // Nunca se envía episodiosVistos ni miPuntaje, así que se mantienen.
        onActualizado?.({
          id: anime.id,
          ...res.cambios,
        });

        toast.success("Datos actualizados desde la API", {
          description: "Título, tipo, año, géneros y sinopsis refrescados.",
        });
      }
    } catch {
      toast.error("Error inesperado al actualizar desde la API");
    } finally {
      setIsRefrescando(false);
    }
  };

  const guardar = () => {
    setError(null);

    const total = calcularTotalPuntajes(puntajes);
    const episodiosVistosFinal = totalEpisodios
      ? Math.min(Number(episodiosVistos) || 0, totalEpisodios)
      : Number(episodiosVistos) || 0;

    const fd = new FormData();
    fd.append("id", String(anime.id));
    fd.append("estado", estado);
    fd.append("episodiosVistos", String(episodiosVistosFinal));
    fd.append("notas", notas);
    fd.append("rewatch", rewatch ? "true" : "false");
    for (const criterio of CRITERIOS_ANIME) {
      const valor = puntajes[criterio.key];
      fd.append(criterio.campo, valor === null ? "" : String(valor));
    }

    startTransition(async () => {
      const res = await actualizarAnimeVisto(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      onActualizado?.({
        id: anime.id,
        estado,
        ...aColumnasPuntaje(puntajes),
        miPuntaje: total ?? anime.miPuntaje,
        notas: notas || null,
        rewatch,
        episodiosVistos: episodiosVistosFinal,
      });
      onClose();
    });
  };

  const eliminar = () => {
    if (!confirm("¿Eliminar este anime de tu catálogo?")) return;
    startTransition(async () => {
      await eliminarAnimeVisto(anime.id);
      onEliminado?.(anime.id);
      onClose();
    });
  };

  const titulo = datosMostrar.titulo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-outline-variant/60 bg-surface-container-lowest text-on-surface shadow-elevation-4">
        <div className="flex items-center justify-between border-b border-outline-variant/40 px-5 py-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight">Editar anime</h3>
            <button
              onClick={refrescarDesdeApi}
              disabled={isRefrescando}
              className="grid size-8 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface disabled:opacity-50"
              aria-label="Actualizar datos desde la API"
              title="Actualizar datos desde la API"
            >
              {isRefrescando ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
            </button>
          </div>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="flex items-center gap-3">
            <img src={datosMostrar.imagen} alt={titulo} className="h-16 w-12 rounded-md object-cover" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-charcoal">{titulo}</p>
              <p className="text-xs text-on-surface-variant">
                {[datosMostrar.tipo, datosMostrar.ano].filter(Boolean).join(" • ")}
              </p>
            </div>
          </div>

          {datosMostrar.generos?.length || datosMostrar.descripcion || datosMostrar.scoreMal !== null || datosMostrar.scoreMal !== undefined ? (
            <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-3">
              {datosMostrar.generos?.length && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {datosMostrar.generos.map((g) => (
                    <span
                      key={g}
                      className="rounded bg-surface-container px-2 py-0.5 text-[10px] text-charcoal"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
              {datosMostrar.scoreMal !== null && datosMostrar.scoreMal !== undefined && (
                <p className="text-xs text-on-surface-variant">
                  Score MAL{" "}
                  <span className="font-medium text-charcoal">
                    {datosMostrar.scoreMal.toFixed(2)}
                  </span>
                </p>
              )}
              {datosMostrar.descripcion?.trim() && (
                <p className="text-xs text-on-surface-variant whitespace-pre-line mt-1">
                  {datosMostrar.descripcion}
                </p>
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-medium text-on-surface-variant">Estado</span>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as AnimeVisto["estado"])}
                className="w-full rounded-lg border border-outline-variant/60 bg-card px-3 py-2 text-sm text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="completado">Completado</option>
                <option value="viendo">Viendo</option>
                <option value="en_pausa">En pausa</option>
                <option value="abandonado">Abandonado</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-on-surface-variant">
                Episodios vistos{totalEpisodios ? ` (de ${totalEpisodios})` : ""}
              </span>
              <input
                type="number"
                min={0}
                max={totalEpisodios ?? undefined}
                value={episodiosVistos}
                onChange={(e) => setEpisodiosVistos(e.target.value)}
                className="w-full rounded-lg border border-outline-variant/60 bg-card px-3 py-2 text-sm text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>

          <PuntajeCriterios
            puntajes={puntajes}
            onChange={cambiarPuntaje}
            puntajePrevio={anime.miPuntaje}
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rewatch}
              onChange={(e) => setRewatch(e.target.checked)}
              className="size-4 rounded border-outline-variant accent-primary"
            />
            <span className="text-sm text-charcoal">Marcar como rewatch</span>
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-on-surface-variant">Notas</span>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-outline-variant/60 bg-card px-3 py-2 text-sm text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-error-container px-3 py-2 text-xs text-on-error-container">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-outline-variant/40 px-5 py-3">
          <button
            onClick={eliminar}
            disabled={isPending}
            className="rounded-full px-2 py-1 text-sm font-medium text-error transition-colors hover:bg-error-container disabled:opacity-60"
          >
            Eliminar
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-full border border-outline-variant/60 bg-card px-4 py-1.5 text-sm font-medium text-charcoal transition-colors hover:bg-surface-container"
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={isPending}
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
