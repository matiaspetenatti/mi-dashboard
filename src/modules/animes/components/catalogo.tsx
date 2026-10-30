"use client";

import { useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Calendar,
  Film,
} from "lucide-react";
import { ModalAgregarAnime } from "@/modules/animes/components/modal/agregar";
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
  const gridRef = useRef<HTMLDivElement>(null);

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

  const hayFiltrosActivos =
    estado !== "todos" || tipo || genero || fechaDesde || fechaHasta || busqueda || temporada;

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
              value={ordenarPor}
              onChange={(e) => actualizarFiltro("ordenar", e.target.value)}
              className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-2.5 py-1 text-xs text-charcoal transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="puntaje_desc">Mayor puntaje</option>
              <option value="puntaje_asc">Menor puntaje</option>
              <option value="fecha_desc">Más recientes</option>
              <option value="fecha_asc">Más antiguos</option>
              <option value="titulo_asc">Título A–Z</option>
              <option value="titulo_desc">Título Z–A</option>
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
        className={`grid grid-cols-2 gap-4 transition-opacity sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 ${
          cargando || isPending ? "pointer-events-none opacity-50" : "opacity-100"
        }`}
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
            />
          ))
        )}
      </div>

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
    </div>
  );
}
