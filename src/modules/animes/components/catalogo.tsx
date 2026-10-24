"use client";

import { useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, SlidersHorizontal, X, Calendar } from "lucide-react";
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href="/animes/calendario"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
          >
            <Calendar size={14} />
            Calendario
          </Link>
          <button
            onClick={() => setMostrarAgregar(true)}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
          >
            <Plus size={14} />
            Agregar anime
          </button>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border ${
              mostrarFiltros
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            <SlidersHorizontal size={14} />
            Filtros
          </button>
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-700"
            >
              <X size={13} />
              Limpiar
            </button>
          )}
          {isPending && <span className="text-xs text-neutral-400">Actualizando...</span>}
        </div>

        <form onSubmit={buscar} className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar en mi catálogo..."
            className="rounded-lg border border-neutral-200 bg-white pl-8 pr-3 py-1.5 text-xs w-56 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </form>
      </div>

      {mostrarFiltros && (
        <div className="rounded-xl border bg-white p-3 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-neutral-200 p-0.5">
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
                  className={`px-2.5 py-1 text-xs rounded-md ${
                    estado === opt.value
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <select
              value={tipo}
              onChange={(e) => actualizarFiltro("tipo", e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs"
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
              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs"
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
              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs"
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
              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs"
            >
              <option value="puntaje_desc">Mayor puntaje</option>
              <option value="puntaje_asc">Menor puntaje</option>
              <option value="fecha_desc">Más recientes</option>
              <option value="fecha_asc">Más antiguos</option>
              <option value="titulo_asc">Título A–Z</option>
              <option value="titulo_desc">Título Z–A</option>
            </select>

            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-neutral-400" />
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => actualizarFiltro("fechaDesde", e.target.value)}
                className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs"
              />
              <span className="text-xs text-neutral-400">–</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => actualizarFiltro("fechaHasta", e.target.value)}
                className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      <div
        ref={gridRef}
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 transition-opacity ${
          cargando || isPending ? "opacity-50 pointer-events-none" : "opacity-100"
        }`}
      >
        {animes.length === 0 ? (
          <div className="col-span-full py-16 text-center text-sm text-neutral-400">
            No se encontraron animes con los filtros seleccionados.
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
