"use client";

import { useRef, useState } from "react";
import { Star, Film, Edit3, Calendar } from "lucide-react";
import type { AnimeVisto } from "@/modules/animes/schema";
import { ModalEditarAnime } from "@/modules/animes/components/modal/editar";
import { ModalDetalleAnime } from "@/modules/animes/components/modal/detalle";
import { MenuContextualAnime } from "@/modules/animes/components/menu-contextual-anime";
import { obtenerDescripcionAnime } from "@/modules/animes/actions/descripcion";
import { puntajeMostrable } from "@/modules/animes/lib/criterios";
import { obtenerTemporadaAnime } from "@/modules/animes/lib/utils";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [cargandoDescripcion, setCargandoDescripcion] = useState(false);
  const solicitudDescripcion = useRef(false);
  const generos = Array.isArray(anime.generos) ? anime.generos : [];
  const titulo = anime.tituloIngles || anime.titulo;

  const total = anime.episodios ?? null;
  const vistos = anime.episodiosVistos || 0;
  const porcentaje = total && total > 0 ? Math.min(100, Math.round((vistos / total) * 100)) : 0;
  const temporada = obtenerTemporadaAnime(anime.fechaEmision);
  const miPuntaje = puntajeMostrable(anime);

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

  const abrirMenu = (x: number, y: number) => {
    setMenuPos({ x, y });
    setMenuOpen(true);
  };

  const cerrarMenu = () => setMenuOpen(false);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={abrirDetalle}
        onContextMenu={(e) => {
          e.preventDefault();
          abrirMenu(e.clientX, e.clientY);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            abrirDetalle();
          }
        }}
        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-outline-variant/40 bg-card shadow-elevation-1 transition duration-200 hover:-translate-y-0.5 hover:shadow-elevation-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-container">
          <img
            src={anime.imagen}
            alt={titulo}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
          <div className="absolute left-2 top-2 flex flex-wrap items-center gap-1">
            {anime.tipo && (
              <span className="rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                {anime.tipo}
              </span>
            )}
            {total && (
              <span className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
                {vistos > 0 ? `${vistos}/${total} eps` : `${total} eps`}
              </span>
            )}
            {anime.ano && (
              <span className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white/90 backdrop-blur-sm">
                {anime.ano}
              </span>
            )}
          </div>
          {miPuntaje !== null && (
            <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-extrabold text-stone-950 shadow-sm">
              <Star size={10} fill="currentColor" />
              {miPuntaje}
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMostrarEditar(true);
            }}
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-inverse-surface/85 px-2 py-1 text-[10px] font-medium text-inverse-on-surface opacity-0 backdrop-blur-sm transition group-hover:opacity-100 focus:opacity-100"
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
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-charcoal" title={titulo}>
            {titulo}
          </p>
          <div className="flex flex-wrap items-center gap-1">
            {temporada && (
              <span className="flex items-center gap-0.5 rounded bg-secondary-container px-1.5 py-0.5 text-[9px] font-medium text-on-secondary-container">
                <Calendar size={9} />
                {temporada.label}
              </span>
            )}
            {generos.slice(0, 2).map((g) => (
              <span
                key={g}
                className="rounded bg-surface-container px-1.5 py-0.5 text-[9px] text-charcoal"
              >
                {g}
              </span>
            ))}
            {generos.length > 2 && (
              <span className="text-[9px] text-pebble">+{generos.length - 2}</span>
            )}
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-outline-variant/40 pt-2 text-[10px] text-pebble">
            <span className="flex items-center gap-1">
              <Film size={11} />
              <span className="font-medium text-charcoal">
                {estadoLabel[anime.estado] || anime.estado}
              </span>
            </span>
            {anime.scoreMal !== null && anime.scoreMal !== undefined && (
              <span className="flex items-center gap-0.5 tabular-nums">
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
          onEliminado={(id: number) => {
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
          onEliminado={(id: number) => {
            onEliminado?.(id);
            setMostrarEditar(false);
          }}
        />
      )}

      {menuOpen && (
        <MenuContextualAnime
          anime={anime}
          open={menuOpen}
          x={menuPos.x}
          y={menuPos.y}
          onClose={cerrarMenu}
          onActualizar={({ episodiosVistos }) =>
            onActualizar?.({ id: anime.id, episodiosVistos })
          }
          onEditar={() => {
            cerrarMenu();
            setMostrarEditar(true);
          }}
        />
      )}
    </>
  );
}
