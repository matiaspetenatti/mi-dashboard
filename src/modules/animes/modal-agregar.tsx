"use client";

import { useState, useTransition } from "react";
import { X, Search, Loader2, Star } from "lucide-react";
import { agregarAnime } from "./actions";
import {
  CRITERIOS_ANIME,
  crearPuntajesVacios,
  type CriterioAnimeKey,
  type PuntajesCriterios,
} from "./criterios";
import { PuntajeCriterios } from "./puntaje-criterios";

type ResultadoKitsu = {
  kitsu_id: number;
  title: string;
  title_english: string | null;
  images: { webp: { large_image_url: string }; jpg: { large_image_url: string } };
  type: string | null;
  episodes: number | null;
  year: number | null;
  aired: { from: string | null };
  genres: { name: string }[];
  score: number | null;
  synopsis: string | null;
};

type EstadoAnime = "viendo" | "completado" | "en_pausa" | "abandonado";

export function ModalAgregarAnime({
  open,
  onClose,
  onAgregado,
}: {
  open: boolean;
  onClose: () => void;
  onAgregado?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ResultadoKitsu[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [seleccionado, setSeleccionado] = useState<ResultadoKitsu | null>(null);
  const [estado, setEstado] = useState<EstadoAnime>("completado");
  const [episodiosVistos, setEpisodiosVistos] = useState("0");
  const [puntajes, setPuntajes] = useState<PuntajesCriterios>(crearPuntajesVacios);
  const [notas, setNotas] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setBuscando(true);
    setError(null);
    try {
      const res = await fetch(`/api/kitsu/anime?q=${encodeURIComponent(query.trim())}&limit=12`);
      const data = await res.json();
      if (!res.ok || data?.error) {
        setError(data?.error || "Error al buscar en Kitsu");
        setResultados([]);
        return;
      }
      setResultados(data.data || []);
    } catch {
      setError("Error al buscar en Kitsu");
    } finally {
      setBuscando(false);
    }
  };

  const volver = () => {
    setSeleccionado(null);
    setEpisodiosVistos("0");
    setPuntajes(crearPuntajesVacios());
    setNotas("");
    setError(null);
  };

  const cambiarPuntaje = (criterio: CriterioAnimeKey, valor: number) => {
    setPuntajes((prev) => ({ ...prev, [criterio]: valor }));
  };

  const guardar = () => {
    if (!seleccionado) return;
    setError(null);
    const fd = new FormData();
    fd.append("kitsuId", String(seleccionado.kitsu_id));
    fd.append("titulo", seleccionado.title);
    fd.append("tituloIngles", seleccionado.title_english || "");
    fd.append("imagen", seleccionado.images.webp.large_image_url || seleccionado.images.jpg.large_image_url);
    fd.append("tipo", seleccionado.type || "");
    fd.append("episodios", seleccionado.episodes?.toString() || "");
    fd.append("ano", seleccionado.year?.toString() || "");
    fd.append("fechaEmision", seleccionado.aired?.from?.slice(0, 10) || "");
    fd.append("generos", JSON.stringify((seleccionado.genres || []).map((g) => g.name)));
    fd.append("descripcion", seleccionado.synopsis || "");
    fd.append("scoreMal", seleccionado.score?.toString() || "");
    fd.append("episodiosVistos", episodiosVistos || "0");
    for (const criterio of CRITERIOS_ANIME) {
      const valor = puntajes[criterio.key];
      fd.append(criterio.campo, valor === null ? "" : String(valor));
    }
    fd.append("estado", estado);
    fd.append("notas", notas);

    startTransition(async () => {
      const res = await agregarAnime(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      onAgregado?.();
      cerrarModal();
    });
  };

  if (!open) return null;

  const cerrarModal = () => {
    setQuery("");
    setResultados([]);
    setSeleccionado(null);
    setEpisodiosVistos("0");
    setPuntajes(crearPuntajesVacios());
    setNotas("");
    setEstado("completado");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-base font-semibold">Agregar anime</h3>
          <button onClick={cerrarModal} className="text-neutral-400 hover:text-neutral-600">
            <X size={18} />
          </button>
        </div>

        {!seleccionado ? (
          <>
            <div className="px-5 py-3 border-b">
              <form onSubmit={buscar} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar anime..."
                    className="w-full rounded-lg border pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={buscando}
                  className="rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                >
                  {buscando ? <Loader2 size={14} className="animate-spin" /> : "Buscar"}
                </button>
              </form>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-1">
              {error && <p className="text-xs text-red-600 px-2">{error}</p>}
              {resultados.length === 0 && !buscando && !error && (
                <p className="text-center text-sm text-neutral-400 py-8">
                  Buscá un anime para agregarlo a tu catálogo
                </p>
              )}
              {resultados.map((r) => (
                <button
                  key={r.kitsu_id}
                  onClick={() => setSeleccionado(r)}
                  className="w-full flex items-center gap-3 rounded-lg p-2 hover:bg-neutral-50 text-left"
                >
                  <img
                    src={r.images.webp.large_image_url || r.images.jpg.large_image_url}
                    alt={r.title}
                    className="h-16 w-12 rounded object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.title_english || r.title}</p>
                    <p className="text-xs text-neutral-500 truncate">
                      {[r.type, r.episodes ? `${r.episodes} eps` : null, r.year].filter(Boolean).join(" • ")}
                    </p>
                    {r.score && (
                      <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                        <Star size={10} /> {r.score.toFixed(2)}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-auto p-5 space-y-4">
            <div className="flex items-start gap-4">
              <img
                src={seleccionado.images.webp.large_image_url || seleccionado.images.jpg.large_image_url}
                alt={seleccionado.title}
                className="h-36 w-26 rounded-lg object-cover shadow-sm"
              />
              <div className="space-y-1">
                <p className="font-semibold">{seleccionado.title_english || seleccionado.title}</p>
                <p className="text-sm text-neutral-500">
                  {[seleccionado.type, seleccionado.episodes ? `${seleccionado.episodes} eps` : null, seleccionado.year].filter(Boolean).join(" • ")}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(seleccionado.genres || []).map((g) => (
                    <span key={g.name} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600">
                      {g.name}
                    </span>
                  ))}
                </div>
                {seleccionado.score && (
                  <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                    <Star size={10} /> {seleccionado.score.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs font-medium text-neutral-600">Estado</span>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoAnime)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="completado">Completado</option>
                  <option value="viendo">Viendo</option>
                  <option value="en_pausa">En pausa</option>
                  <option value="abandonado">Abandonado</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-neutral-600">
                  Episodios vistos
                  {seleccionado.episodes ? ` (de ${seleccionado.episodes})` : ""}
                </span>
                <input
                  type="number"
                  min={0}
                  max={seleccionado.episodes ?? undefined}
                  value={episodiosVistos}
                  onChange={(e) => setEpisodiosVistos(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
              </label>
            </div>

            <PuntajeCriterios puntajes={puntajes} onChange={cambiarPuntaje} />

            <label className="block space-y-1">
              <span className="text-xs font-medium text-neutral-600">Notas (opcional)</span>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
                placeholder="Impresiones, recomendaciones, etc."
              />
            </label>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex justify-end gap-2">
              <button onClick={volver} className="px-3 py-1.5 text-sm rounded-lg border">
                Volver
              </button>
              <button
                onClick={guardar}
                disabled={isPending}
                className="px-3 py-1.5 text-sm rounded-lg bg-neutral-900 text-white disabled:opacity-50"
              >
                {isPending ? "Guardando..." : "Agregar al catálogo"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
