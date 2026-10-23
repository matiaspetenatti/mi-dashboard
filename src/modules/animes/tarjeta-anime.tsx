"use client";

import { useRef, useState } from "react";
import { Star, Film, Edit3, Calendar } from "lucide-react";
import type { AnimeVisto } from "./schema";
import { ModalEditarAnime } from "./modal-editar";
import { ModalDetalleAnime } from "./modal-detalle";
import { obtenerDescripcionAnime } from "./actions";
import { obtenerTemporadaAnime } from "./utils";

const estadoLabel: Record<string, string> = {
  viendo: "Viendo",
  completado: "Completado",
  en_pausa: "En pausa",
  abandonado: "Abandonado",
};

export function TarjetaAnime({
  anime,
  onActualizar,
  onEliminado,
}: {
  anime: AnimeVisto;
  onActualizar?: (cambios: Partial<AnimeVisto> & { id: number }) => void;
  onEliminado?: (id: number) => void;
}) {
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [cargandoDescripcion, setCargandoDescripcion] = useState(false);
  const solicitudDescripcion = useRef(false);
  const generos = Array.isArray(anime.generos) ? anime.generos : [];
  const titulo = anime.tituloIngles || anime.titulo;

  const total = anime.episodios ?? null;
  const vistos = anime.episodiosVistos || 0;
  const porcentaje = total && total > 0 ? Math.min(100, Math.round((vistos / total) * 100)) : 0;
  const temporada = obtenerTemporadaAnime(anime.fechaEmision);

  const abrirDetalle = () => {
    setMostrarDetalle(true);

    if (anime.descripcion?.trim() || solicitudDescripcion.current) return;

    solicitudDescripcion.current = true;
    setCargandoDescripcion(true);

    const cargar = async () => {
      let texto: string | null = null;

      try {
        const res = await obtenerDescripcionAnime(anime.id);
        if ("descripcion" in res) texto = res.descripcion ?? null;
      } catch {
        // Si la acción falla, se intenta directo contra Kitsu.
      }

      if (!texto) {
        try {
          const res = await fetch(`/api/kitsu/anime?id=${anime.kitsuId}`);
          if (res.ok) {
            const data = await res.json();
            texto = data?.data?.synopsis ?? null;
          }
        } catch {
          texto = null;
        }
      }

      if (texto?.trim()) {
        onActualizar?.({ id: anime.id, descripcion: texto });
      }
      setCargandoDescripcion(false);
    };

    cargar();
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={abrirDetalle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            abrirDetalle();
          }
        }}
        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-100">
          <img
            src={anime.imagen}
            alt={titulo}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
          <div className="absolute left-2 top-2 flex flex-wrap items-center gap-1">
            {anime.tipo && (
              <span className="rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                {anime.tipo}
              </span>
            )}
            {total && (
              <span className="rounded bg-black/70 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                {vistos > 0 ? `${vistos}/${total} eps` : `${total} eps`}
              </span>
            )}
            {anime.ano && (
              <span className="rounded bg-black/70 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                {anime.ano}
              </span>
            )}
          </div>
          {anime.miPuntaje !== null && anime.miPuntaje !== undefined && (
            <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded bg-amber-400/95 px-2 py-0.5 text-[11px] font-bold text-amber-950 shadow-sm">
              <Star size={10} fill="currentColor" />
              {anime.miPuntaje}
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMostrarEditar(true);
            }}
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-[10px] text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100 backdrop-blur-sm"
          >
            <Edit3 size={10} />
            Editar
          </button>
          {total && vistos > 0 ? (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/25">
              <div className="h-full bg-white/90 transition-all" style={{ width: `${porcentaje}%` }} />
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3">
          <p className="line-clamp-2 text-sm font-semibold leading-tight text-neutral-900" title={titulo}>
            {titulo}
          </p>
          <div className="flex flex-wrap items-center gap-1">
            {temporada && (
              <span className="flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">
                <Calendar size={9} />
                {temporada.label}
              </span>
            )}
            {generos.slice(0, 2).map((g) => (
              <span
                key={g}
                className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600"
              >
                {g}
              </span>
            ))}
            {generos.length > 2 && (
              <span className="text-[10px] text-neutral-400">+{generos.length - 2}</span>
            )}
          </div>
          <div className="mt-auto flex items-center justify-between text-[10px] text-neutral-400">
            <span className="flex items-center gap-1">
              <Film size={11} />
              {estadoLabel[anime.estado] || anime.estado}
            </span>
            {anime.scoreMal !== null && anime.scoreMal !== undefined && (
              <span className="flex items-center gap-0.5">
                <Star size={10} />
                MAL {anime.scoreMal.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>

      {mostrarDetalle && (
        <ModalDetalleAnime
          open
          onClose={() => setMostrarDetalle(false)}
          anime={anime}
          cargandoDescripcion={cargandoDescripcion}
          onActualizar={onActualizar}
          onEliminado={(id) => {
            onEliminado?.(id);
            setMostrarDetalle(false);
          }}
        />
      )}

      {mostrarEditar && (
        <ModalEditarAnime
          open
          onClose={() => setMostrarEditar(false)}
          anime={anime}
          onActualizado={onActualizar}
          onEliminado={(id) => {
            onEliminado?.(id);
            setMostrarDetalle(false);
          }}
        />
      )}
    </>
  );
}
