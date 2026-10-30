"use client";

import { useState, useTransition } from "react";
import { X, Search, Loader2, Star } from "lucide-react";
import { agregarAnime } from "@/modules/animes/actions/agregar";
import {
  CRITERIOS_ANIME,
  crearPuntajesVacios,
  type CriterioAnimeKey,
  type PuntajesCriterios,
} from "@/modules/animes/lib/criterios";
import { PuntajeCriterios } from "@/modules/animes/components/puntaje-criterios";

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
  onCerrar,
  onAgregado,
}: {
  onCerrar: () => void;
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

  const cerrarModal = () => {
    setQuery("");
    setResultados([]);
    setSeleccionado(null);
    setEpisodiosVistos("0");
    setPuntajes(crearPuntajesVacios());
    setNotas("");
    setEstado("completado");
    setError(null);
    onCerrar();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-outline-variant/60 bg-surface-container-lowest text-on-surface shadow-elevation-4">
        <div className="flex items-center justify-between border-b border-outline-variant/40 px-5 py-4">
          <h3 className="text-lg font-semibold tracking-tight">Agregar anime</h3>
          <button
            onClick={cerrarModal}
            className="grid size-8 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {!seleccionado ? (
          <>
            <div className="border-b border-outline-variant/40 px-5 py-3">
              <form onSubmit={buscar} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pebble"
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar anime..."
                    className="w-full rounded-full border border-outline-variant/60 bg-card py-2 pl-9 pr-4 text-sm text-on-surface placeholder:text-pebble transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={buscando}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {buscando ? <Loader2 size={14} className="animate-spin" /> : "Buscar"}
                </button>
              </form>
            </div>
            <div className="flex-1 space-y-1 overflow-auto p-3">
              {error && (
                <p className="mx-1 rounded-lg bg-error-container px-3 py-2 text-xs text-on-error-container">
                  {error}
                </p>
              )}
              {resultados.length === 0 && !buscando && !error && (
                <p className="py-8 text-center text-sm text-on-surface-variant">
                  Buscá un anime para agregarlo a tu catálogo
                </p>
              )}
              {resultados.map((r) => (
                <button
                  key={r.kitsu_id}
                  onClick={() => setSeleccionado(r)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-surface-container-low"
                >
                  <img
                    src={r.images.webp.large_image_url || r.images.jpg.large_image_url}
                    alt={r.title}
                    className="h-16 w-12 shrink-0 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-charcoal">
                      {r.title_english || r.title}
                    </p>
                    <p className="truncate text-xs text-on-surface-variant">
                      {[r.type, r.episodes ? `${r.episodes} eps` : null, r.year].filter(Boolean).join(" • ")}
                    </p>
                    {r.score && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs tabular-nums text-pebble">
                        <Star size={10} /> {r.score.toFixed(2)}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 space-y-4 overflow-auto p-5">
            <div className="flex items-start gap-4">
              <img
                src={seleccionado.images.webp.large_image_url || seleccionado.images.jpg.large_image_url}
                alt={seleccionado.title}
                className="h-36 w-26 shrink-0 rounded-lg object-cover shadow-elevation-1"
              />
              <div className="min-w-0 space-y-1">
                <p className="font-semibold text-charcoal">
                  {seleccionado.title_english || seleccionado.title}
                </p>
                <p className="text-sm text-on-surface-variant">
                  {[seleccionado.type, seleccionado.episodes ? `${seleccionado.episodes} eps` : null, seleccionado.year]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
                {seleccionado.genres?.length > 0 && (
                  <p className="text-xs text-pebble">
                    {seleccionado.genres.map((g) => g.name).join(", ")}
                  </p>
                )}
                {seleccionado.score && (
                  <p className="flex items-center gap-1 text-xs tabular-nums text-pebble">
                    <Star size={10} /> {seleccionado.score.toFixed(2)} (score global)
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-on-surface-variant">Estado</label>
              <div className="flex flex-wrap gap-1.5">
                {(["viendo", "completado", "en_pausa", "abandonado"] as EstadoAnime[]).map((e) => (
                  <button
                    key={e}
                    onClick={() => setEstado(e)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      estado === e
                        ? "border-inverse-surface bg-inverse-surface text-inverse-on-surface"
                        : "border-outline-variant/60 bg-card text-charcoal hover:bg-surface-container"
                    }`}
                  >
                    {e === "viendo" ? "Viendo" : e === "completado" ? "Completado" : e === "en_pausa" ? "En pausa" : "Abandonado"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-on-surface-variant">Episodios vistos</label>
              <input
                type="number"
                min={0}
                max={seleccionado.episodes ?? undefined}
                value={episodiosVistos}
                onChange={(e) => setEpisodiosVistos(e.target.value)}
                className="w-32 rounded-lg border border-outline-variant/60 bg-card px-3 py-1.5 text-sm text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {seleccionado.episodes && (
                <p className="text-xs text-pebble">de {seleccionado.episodes} episodios</p>
              )}
            </div>

            <PuntajeCriterios puntajes={puntajes} onChange={cambiarPuntaje} />

            <div className="space-y-1">
              <label className="text-xs font-medium text-on-surface-variant">Notas</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                placeholder="Notas personales..."
                className="w-full resize-none rounded-lg border border-outline-variant/60 bg-card px-3 py-2 text-sm text-on-surface placeholder:text-pebble transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-error-container px-3 py-2 text-xs text-on-error-container">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between border-t border-outline-variant/40 pt-4">
              <button
                onClick={volver}
                className="rounded-full px-2 py-1 text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                ← Volver
              </button>
              <button
                onClick={guardar}
                disabled={isPending}
                className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
