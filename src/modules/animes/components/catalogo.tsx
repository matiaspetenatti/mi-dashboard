"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Calendar,
  Film,
  Grid3x3,
  List,
  Download,
  Upload,
  Trash2,
  Tag,
  Heart,
} from "lucide-react";
import {
  actualizarEstadoAnimes,
  eliminarAnimes,
  agregarTagAnimes,
} from "@/modules/animes/actions/bulk";

import { ModalAgregarAnime } from "@/modules/animes/components/modal/agregar";
import { ModalDetalleAnime } from "@/modules/animes/components/modal/detalle";
import { obtenerAnimePorId } from "@/modules/animes/actions/consulta";
import { agregarAnime } from "@/modules/animes/actions/agregar";
import { PaginacionAnimes as BarraPaginacion } from "@/modules/animes/components/paginacion";
import { TarjetaAnime } from "@/modules/animes/components/tarjeta-anime";
import Link from "next/link";
import type {
  AnimeMetadatos,
  AnimeVisto,
  PaginacionAnimes,
} from "@/modules/animes/schema";

export function AnimesCatalogo({
  animes,
  metadatos,
  paginacion,
  cargando = false,
  onActualizar,
  onEliminado,
  onAgregado,
}: {
  animes: AnimeVisto[];
  metadatos: AnimeMetadatos;
  paginacion?: PaginacionAnimes;
  cargando?: boolean;
  onActualizar?: (cambios: Partial<AnimeVisto> & { id: number }) => void;
  onEliminado?: (id: number) => void;
  onAgregado?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [busqueda, setBusqueda] = useState(searchParams.get("q") || "");
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window === "undefined") return "grid";
    return (window.localStorage.getItem("animes-view") as "grid" | "list") || "grid";
  });
  const [density, setDensity] = useState<"comfortable" | "compact">(() => {
    if (typeof window === "undefined") return "comfortable";
    return (
      (window.localStorage.getItem("animes-density") as "comfortable" | "compact") ||
      "comfortable"
    );
  });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [detalleAnime, setDetalleAnime] = useState<AnimeVisto | null>(null);

  useEffect(() => {
    const detalleId = searchParams.get("detalle");
    if (!detalleId) {
      const t = window.setTimeout(() => setDetalleAnime(null), 0);
      return () => window.clearTimeout(t);
    }
    const id = Number(detalleId);
    if (!Number.isFinite(id) || id <= 0) return;
    // Buscar en la página actual primero.
    const encontrado = animes.find((a) => a.id === id);
    if (encontrado) {
      const t = window.setTimeout(() => setDetalleAnime(encontrado), 0);
      return () => window.clearTimeout(t);
    }
    // Si no está, consultarlo al servidor.
    let cancelado = false;
    obtenerAnimePorId(id).then((res) => {
      if (cancelado) return;
      if ("anime" in res && res.anime) setDetalleAnime(res.anime);
    });
    return () => {
      cancelado = true;
    };
  }, [searchParams, animes]);
  const [bulkEstado, setBulkEstado] = useState("completado");
  const [bulkTag, setBulkTag] = useState("");
  const [isBulkPending, startBulkTransition] = useTransition();
  const gridRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("animes-view", viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("animes-density", density);
    }
  }, [density]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const typing =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable;
      if (typing) return;
      if (e.key === "/" ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        setMostrarAgregar(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const paginaParam = Number(searchParams.get("pagina") || "1");
  const paginaActual =
    Number.isFinite(paginaParam) && paginaParam > 0
      ? Math.trunc(paginaParam)
      : 1;

  const estado = searchParams.get("estado") || "todos";
  const tipo = searchParams.get("tipo") || "";
  const genero = searchParams.get("genero") || "";
  const ordenarPor = searchParams.get("ordenar") || "puntaje_desc";
  const fechaDesde = searchParams.get("fechaDesde") || "";
  const fechaHasta = searchParams.get("fechaHasta") || "";
  const temporada = searchParams.get("temporada") || "";
  const favoritoParam = searchParams.get("favorito") || "";
  const estudio = searchParams.get("estudio") || "";
  const fuente = searchParams.get("fuente") || "";
  const formato = searchParams.get("formato") || "";
  const tagsSeleccionados = (searchParams.get("tags") || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const puntajeMin = searchParams.get("puntajeMin") || "";
  const puntajeMax = searchParams.get("puntajeMax") || "";
  const scoreMalMin = searchParams.get("scoreMalMin") || "";
  const scoreMalMax = searchParams.get("scoreMalMax") || "";

  const navegarA = (params: URLSearchParams) => {
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  };

  const actualizarFiltro = (clave: string, valor: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!valor || valor === "todos") {
      params.delete(clave);
    } else {
      params.set(clave, valor);
    }
    if (clave !== "pagina") params.delete("pagina");
    navegarA(params);
  };

  const cambiarPagina = (nueva: number) => {
    if (nueva === paginaActual) return;

    const params = new URLSearchParams(searchParams.toString());
    if (nueva <= 1) {
      params.delete("pagina");
    } else {
      params.set("pagina", String(nueva));
    }

    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    navegarA(params);
  };

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    actualizarFiltro("q", busqueda);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const toggleSeleccion = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const seleccionarTodos = () => {
    setSelected(new Set(animes.map((a) => a.id)));
  };

  const limpiarSeleccion = () => setSelected(new Set());

  const actualizarTagsParam = (nuevos: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nuevos.length === 0) params.delete("tags");
    else params.set("tags", nuevos.join(","));
    params.delete("pagina");
    navegarA(params);
  };

  const exportarJSON = () => {
    const blob = new Blob([JSON.stringify(animes, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "animes.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const ejecutarBulkEstado = () => {
    startBulkTransition(async () => {
      await actualizarEstadoAnimes(Array.from(selected), bulkEstado as "completado");
      limpiarSeleccion();
      onAgregado?.();
    });
  };

  const ejecutarBulkEliminar = () => {
    if (!confirm(`¿Eliminar ${selected.size} anime(s) seleccionados?`)) return;
    startBulkTransition(async () => {
      await eliminarAnimes(Array.from(selected));
      limpiarSeleccion();
      onAgregado?.();
    });
  };

  const ejecutarBulkTag = () => {
    if (!bulkTag.trim()) return;
    startBulkTransition(async () => {
      await agregarTagAnimes(Array.from(selected), bulkTag);
      setBulkTag("");
      limpiarSeleccion();
      onAgregado?.();
    });
  };

  const importarJSON = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) return;
      startBulkTransition(async () => {
        for (const item of data) {
          const fd = new FormData();
          fd.append("kitsuId", String(item.kitsuId ?? item.kitsu_id ?? 0));
          fd.append("titulo", String(item.titulo ?? ""));
          fd.append("tituloIngles", item.tituloIngles ?? item.titulo_ingles ?? "");
          fd.append("imagen", String(item.imagen ?? ""));
          fd.append("tipo", item.tipo ?? "");
          fd.append("episodios", item.episodios?.toString() ?? "");
          fd.append("ano", item.ano?.toString() ?? "");
          fd.append("fechaEmision", item.fechaEmision ?? item.fecha_emision ?? "");
          fd.append("generos", JSON.stringify(item.generos ?? []));
          fd.append("descripcion", item.descripcion ?? "");
          fd.append("scoreMal", item.scoreMal ?? item.score_mal ?? "");
          fd.append("estado", item.estado ?? "completado");
          fd.append("notas", item.notas ?? "");
          fd.append("episodiosVistos", String(item.episodiosVistos ?? item.episodios_vistos ?? 0));
          fd.append("favorito", item.favorito ? "true" : "false");
          fd.append("anilistId", item.anilistId ?? item.anilist_id ?? "");
          fd.append("estudio", item.estudio ?? "");
          fd.append("fuente", item.fuente ?? "");
          fd.append("formato", item.formato ?? "");
          fd.append("tags", JSON.stringify(item.tags ?? []));
          await agregarAnime(fd);
        }
        onAgregado?.();
      });
    } catch {
      // ignorar
    }
  };

  const hayFiltrosActivos =
    estado !== "todos" ||
    tipo ||
    genero ||
    fechaDesde ||
    fechaHasta ||
    busqueda ||
    temporada ||
    favoritoParam ||
    estudio ||
    fuente ||
    formato ||
    tagsSeleccionados.length > 0 ||
    puntajeMin ||
    puntajeMax ||
    scoreMalMin ||
    scoreMalMax;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href="/animes/calendario"
            className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 bg-card px-3.5 py-1.5 text-xs font-semibold text-charcoal transition-colors hover:bg-surface-container active:scale-[0.98]"
          >
            <Calendar size={14} />
            Calendario
          </Link>
          <Link
            href="/animes/estadisticas"
            className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 bg-card px-3.5 py-1.5 text-xs font-semibold text-charcoal transition-colors hover:bg-surface-container active:scale-[0.98]"
          >
            Estadísticas
          </Link>
          <button
            onClick={() => setMostrarAgregar(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-on-primary transition-colors hover:bg-primary/90 active:scale-[0.98]"
          >
            <Plus size={14} />
            Agregar anime
          </button>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors active:scale-[0.98] ${
              mostrarFiltros
                ? "border-inverse-surface bg-inverse-surface text-inverse-on-surface"
                : "border-outline-variant/60 bg-card text-charcoal hover:bg-surface-container"
            }`}
          >
            <SlidersHorizontal size={14} />
            Filtros
          </button>
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            >
              <X size={13} />
              Limpiar
            </button>
          )}
          <div className="inline-flex items-center gap-0.5 rounded-full border border-outline-variant/60 bg-card p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`grid size-7 place-items-center rounded-full transition-colors ${
                viewMode === "grid"
                  ? "bg-inverse-surface text-inverse-on-surface"
                  : "text-charcoal hover:bg-surface-container"
              }`}
              aria-label="Vista grilla"
            >
              <Grid3x3 size={13} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`grid size-7 place-items-center rounded-full transition-colors ${
                viewMode === "list"
                  ? "bg-inverse-surface text-inverse-on-surface"
                  : "text-charcoal hover:bg-surface-container"
              }`}
              aria-label="Vista lista"
            >
              <List size={13} />
            </button>
          </div>
          <button
            onClick={exportarJSON}
            className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 bg-card px-3 py-1.5 text-xs font-semibold text-charcoal transition-colors hover:bg-surface-container active:scale-[0.98]"
          >
            <Download size={13} />
            Exportar
          </button>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-outline-variant/60 bg-card px-3 py-1.5 text-xs font-semibold text-charcoal transition-colors hover:bg-surface-container active:scale-[0.98]">
            <Upload size={13} />
            Importar
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importarJSON(file);
                e.target.value = "";
              }}
            />
          </label>
          <button
            onClick={() => setDensity((d) => (d === "comfortable" ? "compact" : "comfortable"))}
            className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 bg-card px-3 py-1.5 text-xs font-semibold text-charcoal transition-colors hover:bg-surface-container active:scale-[0.98]"
          >
            {density === "comfortable" ? "Compacto" : "Cómodo"}
          </button>
          {isPending && (
            <span className="text-xs text-on-surface-variant">
              Actualizando...
            </span>
          )}
        </div>

        <form onSubmit={buscar} className="relative w-full sm:w-64">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pebble"
          />
          <input
            ref={searchInputRef}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar en mi catálogo..."
            className="w-full rounded-full border border-outline-variant/60 bg-card py-1.5 pl-9 pr-4 text-xs text-on-surface placeholder:text-pebble transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </form>
      </div>

      {mostrarFiltros && (
        <div className="space-y-3 rounded-xl border border-outline-variant/50 bg-card p-3 shadow-elevation-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-outline-variant/50 bg-surface-container-low p-0.5">
              {[
                { value: "todos", label: "Todos" },
                { value: "planeado", label: "Planeado" },
                { value: "completado", label: "Completado" },
                { value: "viendo", label: "Viendo" },
                { value: "en_pausa", label: "En pausa" },
                { value: "abandonado", label: "Abandonado" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => actualizarFiltro("estado", opt.value)}
                  className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                    estado === opt.value
                      ? "bg-inverse-surface font-semibold text-inverse-on-surface"
                      : "text-charcoal hover:bg-surface-container"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <select
              value={tipo}
              onChange={(e) => actualizarFiltro("tipo", e.target.value)}
              className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2.5 py-1 text-xs text-charcoal transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todos los tipos</option>
              {metadatos.tipos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={genero}
              onChange={(e) => actualizarFiltro("genero", e.target.value)}
              className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2.5 py-1 text-xs text-charcoal transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todos los géneros</option>
              {metadatos.generos.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            <select
              value={temporada}
              onChange={(e) => actualizarFiltro("temporada", e.target.value)}
              className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2.5 py-1 text-xs text-charcoal transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todas las temporadas</option>
              {(metadatos.temporadas || []).map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>

            <select
              value={estudio}
              onChange={(e) => actualizarFiltro("estudio", e.target.value)}
              className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2.5 py-1 text-xs text-charcoal transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todos los estudios</option>
              {(metadatos.estudios || []).map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>

            <select
              value={fuente}
              onChange={(e) => actualizarFiltro("fuente", e.target.value)}
              className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2.5 py-1 text-xs text-charcoal transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todas las fuentes</option>
              {(metadatos.fuentes || []).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            <select
              value={formato}
              onChange={(e) => actualizarFiltro("formato", e.target.value)}
              className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2.5 py-1 text-xs text-charcoal transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todos los formatos</option>
              {(metadatos.formatos || []).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            <button
              onClick={() =>
                actualizarFiltro("favorito", favoritoParam === "true" ? "" : "true")
              }
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                favoritoParam === "true"
                  ? "border-inverse-surface bg-inverse-surface text-inverse-on-surface"
                  : "border-outline-variant/60 bg-card text-charcoal hover:bg-surface-container"
              }`}
            >
              <Heart size={12} />
              Favoritos
            </button>

            <div className="flex flex-wrap items-center gap-1">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    actualizarTagsParam([...tagsSeleccionados, e.target.value]);
                  }
                }}
                className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2.5 py-1 text-xs text-charcoal transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Filtrar por tag...</option>
                {(metadatos.tags || [])
                  .filter((t) => !tagsSeleccionados.includes(t))
                  .map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
              </select>
              {tagsSeleccionados.map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    actualizarTagsParam(tagsSeleccionados.filter((x) => x !== t))
                  }
                  className="inline-flex items-center gap-1 rounded-full bg-primary-container px-2 py-0.5 text-[10px] font-medium text-on-primary-container"
                >
                  #{t} <X size={10} />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-pebble">Mi puntaje</span>
              <input
                type="number"
                min={0}
                max={100}
                value={puntajeMin}
                onChange={(e) => actualizarFiltro("puntajeMin", e.target.value)}
                placeholder="min"
                className="w-14 rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2 py-1 text-xs text-charcoal"
              />
              <span className="text-[10px] text-pebble">–</span>
              <input
                type="number"
                min={0}
                max={100}
                value={puntajeMax}
                onChange={(e) => actualizarFiltro("puntajeMax", e.target.value)}
                placeholder="max"
                className="w-14 rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2 py-1 text-xs text-charcoal"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-pebble">MAL</span>
              <input
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={scoreMalMin}
                onChange={(e) => actualizarFiltro("scoreMalMin", e.target.value)}
                placeholder="min"
                className="w-14 rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2 py-1 text-xs text-charcoal"
              />
              <span className="text-[10px] text-pebble">–</span>
              <input
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={scoreMalMax}
                onChange={(e) => actualizarFiltro("scoreMalMax", e.target.value)}
                placeholder="max"
                className="w-14 rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2 py-1 text-xs text-charcoal"
              />
            </div>

            <select
              value={ordenarPor}
              onChange={(e) => actualizarFiltro("ordenar", e.target.value)}
              className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2.5 py-1 text-xs text-charcoal transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="puntaje_desc">Mayor puntaje</option>
              <option value="puntaje_asc">Menor puntaje</option>
              <option value="fecha_desc">Más recientes</option>
              <option value="fecha_asc">Más antiguos</option>
              <option value="titulo_asc">Título A–Z</option>
              <option value="titulo_desc">Título Z-A</option>
              <option value="score_mal_desc">Mayor score MAL</option>
              <option value="episodios_desc">Más episodios</option>
              <option value="progreso_desc">Mayor progreso</option>
              <option value="favorito_desc">Favoritos primero</option>
            </select>

            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-pebble" />
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => actualizarFiltro("fechaDesde", e.target.value)}
                className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2 py-1 text-xs text-charcoal transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-xs text-pebble">–</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => actualizarFiltro("fechaHasta", e.target.value)}
                className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2 py-1 text-xs text-charcoal transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      )}

      <div
        ref={gridRef}
        className={`transition-opacity ${
          viewMode === "list" ? "flex flex-col gap-3" : `grid gap-4 ${density === "compact" ? "grid-cols-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"}`
        } ${cargando || isPending ? "pointer-events-none opacity-50" : "opacity-100"}`}
      >
        {animes.length === 0 ? (
          <div className="col-span-full flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-low px-6 py-16 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-primary-container text-on-primary-container">
              <Film size={18} />
            </span>
            <p className="text-sm font-medium text-charcoal">
              No se encontraron animes con los filtros seleccionados.
            </p>
            <p className="text-xs text-pebble">
              Probá limpiar los filtros o agregar un anime nuevo al catálogo.
            </p>
          </div>
        ) : (
          animes.map((anime) => (
            <TarjetaAnime
              key={anime.id}
              anime={anime}
              onActualizar={onActualizar}
              onEliminado={onEliminado}
              seleccionable
              seleccionado={selected.has(anime.id)}
              onToggleSeleccion={toggleSeleccion}
              variante={viewMode === "list" ? "lista" : "grilla"}
            />
          ))
        )}
      </div>

      {selected.size > 0 && (
        <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-outline-variant/60 bg-card p-3 shadow-elevation-2">
          <span className="text-xs font-semibold text-charcoal">
            {selected.size} seleccionado(s)
          </span>
          <button
            onClick={seleccionarTodos}
            className="rounded-full px-2 py-1 text-xs text-on-surface-variant hover:bg-surface-container"
          >
            Seleccionar todos
          </button>
          <button
            onClick={limpiarSeleccion}
            className="rounded-full px-2 py-1 text-xs text-on-surface-variant hover:bg-surface-container"
          >
            Limpiar
          </button>
          <select
            value={bulkEstado}
            onChange={(e) => setBulkEstado(e.target.value)}
            className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2 py-1 text-xs text-charcoal"
          >
            <option value="planeado">Planeado</option>
            <option value="viendo">Viendo</option>
            <option value="completado">Completado</option>
            <option value="en_pausa">En pausa</option>
            <option value="abandonado">Abandonado</option>
          </select>
          <button
            onClick={ejecutarBulkEstado}
            disabled={isBulkPending}
            className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-on-primary hover:bg-primary/90 disabled:opacity-50"
          >
            Cambiar estado
          </button>
          <input
            value={bulkTag}
            onChange={(e) => setBulkTag(e.target.value)}
            placeholder="Tag..."
            className="w-24 rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2 py-1 text-xs text-charcoal"
          />
          <button
            onClick={ejecutarBulkTag}
            disabled={isBulkPending || !bulkTag.trim()}
            className="inline-flex items-center gap-1 rounded-full border border-outline-variant/60 bg-card px-3 py-1 text-xs font-semibold text-charcoal hover:bg-surface-container disabled:opacity-50"
          >
            <Tag size={12} /> Agregar tag
          </button>
          <button
            onClick={ejecutarBulkEliminar}
            disabled={isBulkPending}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-error hover:bg-error-container disabled:opacity-50"
          >
            <Trash2 size={12} /> Eliminar
          </button>
          {isBulkPending && (
            <span className="text-xs text-on-surface-variant">Procesando...</span>
          )}
        </div>
      )}

      {paginacion && paginacion.totalPaginas > 1 && (
        <BarraPaginacion
          paginacion={paginacion}
          onCambiarPagina={cambiarPagina}
        />
      )}

      {mostrarAgregar && (
        <ModalAgregarAnime
          onCerrar={() => setMostrarAgregar(false)}
          onAgregado={() => {
            setMostrarAgregar(false);
            onAgregado?.();
          }}
        />
      )}

      {detalleAnime && (
        <ModalDetalleAnime
          open
          onClose={() => {
            setDetalleAnime(null);
            // limpiar param de la URL
            const params = new URLSearchParams(searchParams.toString());
            params.delete("detalle");
            navegarA(params);
          }}
          anime={detalleAnime}
          onActualizar={(cambios) => {
            onActualizar?.(cambios);
            setDetalleAnime((prev) =>
              prev && prev.id === cambios.id ? { ...prev, ...cambios } : prev,
            );
          }}
          onEliminado={(id) => {
            onEliminado?.(id);
            setDetalleAnime(null);
          }}
        />
      )}
    </div>
  );
}
