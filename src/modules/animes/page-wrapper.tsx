"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimesCatalogo } from "./components/catalogo";
import type { AnimeMetadatos, AnimeVisto, PaginacionAnimes } from "./schema";

const CACHE_KEY = "animes-catalogo-cache-v2";
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRADAS = 30;

type PaginaAnimes = {
  animes: AnimeVisto[];
  paginacion: PaginacionAnimes;
  metadatos?: AnimeMetadatos;
};

type EntradaCache = {
  data: PaginaAnimes;
  guardadoEn: number;
};

const cachePaginas = new Map<string, EntradaCache>();
let cacheHidratada = false;

function hidratarCache() {
  if (cacheHidratada || typeof window === "undefined") return;
  cacheHidratada = true;

  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const guardadas = JSON.parse(raw) as Record<string, EntradaCache>;
    const ahora = Date.now();
    for (const [clave, entrada] of Object.entries(guardadas)) {
      if (entrada?.data && ahora - entrada.guardadoEn < CACHE_TTL_MS) {
        cachePaginas.set(clave, entrada);
      }
    }
  } catch {
    // Si el almacenamiento no está disponible, seguimos con la caché en memoria.
  }
}

function persistirCache() {
  if (typeof window === "undefined") return;

  try {
    while (cachePaginas.size > CACHE_MAX_ENTRADAS) {
      const primeraClave = cachePaginas.keys().next().value;
      if (primeraClave === undefined) break;
      cachePaginas.delete(primeraClave);
    }
    window.sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify(Object.fromEntries(cachePaginas)),
    );
  } catch {
    // Ignoramos errores de cuota o almacenamiento deshabilitado.
  }
}

function limpiarCachePaginas() {
  cachePaginas.clear();
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // Sin acceso a sessionStorage: la caché en memoria ya está limpia.
  }
}

function leerCache(clave: string) {
  const entrada = cachePaginas.get(clave);
  if (!entrada) return null;
  if (Date.now() - entrada.guardadoEn > CACHE_TTL_MS) {
    cachePaginas.delete(clave);
    return null;
  }
  return entrada.data;
}

function guardarCache(clave: string, data: PaginaAnimes) {
  cachePaginas.set(clave, { data, guardadoEn: Date.now() });
  persistirCache();
}

export function AnimesPageWrapper() {
  const searchParams = useSearchParams();
  const clave = searchParams.toString();
  const [datos, setDatos] = useState<PaginaAnimes | null>(null);
  const [metadatos, setMetadatos] = useState<AnimeMetadatos>({
    tipos: [],
    generos: [],
    anos: [],
    temporadas: [],
  });
  const [cargando, setCargando] = useState(true);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    hidratarCache();

    const controller = new AbortController();

    const cargar = async () => {
      const cache = leerCache(clave);
      if (cache) {
        setDatos(cache);
        if (cache.metadatos) setMetadatos(cache.metadatos);
        setCargando(false);
        return;
      }

      setCargando(true);

      try {
        const res = await fetch(`/api/animes?${clave}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;

        const text = await res.text();
        if (!text) return;

        const data = JSON.parse(text) as PaginaAnimes;
        if (!data?.animes || !data.paginacion) return;

        guardarCache(clave, data);
        setDatos(data);
        if (data.metadatos) setMetadatos(data.metadatos);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        // Si falla la red, dejamos la página anterior visible.
      } finally {
        if (!controller.signal.aborted) setCargando(false);
      }
    };

    cargar();

    return () => controller.abort();
  }, [clave, recarga]);

  const invalidarYRecargar = useCallback(() => {
    limpiarCachePaginas();
    setRecarga((valor) => valor + 1);
  }, []);

  const actualizarAnime = useCallback(
    (cambios: Partial<AnimeVisto> & { id: number }) => {
      if (!datos) return;

      const actualizado: PaginaAnimes = {
        ...datos,
        animes: datos.animes.map((anime) =>
          anime.id === cambios.id ? { ...anime, ...cambios } : anime,
        ),
      };

      setDatos(actualizado);
      guardarCache(clave, actualizado);

      // Los cambios de puntaje o estado pueden alterar el orden o los filtros,
      // así que recargamos la página para mantener la paginación consistente.
      const afectaListado = Object.keys(cambios).some(
        (campo) =>
          campo === "estado" ||
          campo === "rewatch" ||
          campo === "miPuntaje" ||
          campo.startsWith("puntaje"),
      );
      if (afectaListado) invalidarYRecargar();
    },
    [clave, datos, invalidarYRecargar],
  );

  const eliminarAnime = useCallback(
    (id: number) => {
      if (datos) {
        const animes = datos.animes.filter((anime) => anime.id !== id);
        const total = Math.max(0, datos.paginacion.total - 1);
        const totalPaginas = Math.max(
          1,
          Math.ceil(total / datos.paginacion.limite),
        );
        const pagina = Math.min(datos.paginacion.pagina, totalPaginas);

        const actualizado: PaginaAnimes = {
          ...datos,
          animes,
          paginacion: {
            ...datos.paginacion,
            total,
            totalPaginas,
            pagina,
          },
        };

        setDatos(actualizado);
      }

      // El servidor ya invalidó el tag; limpiamos la caché del cliente y
      // recargamos la página actual para corregir totales y huecos.
      invalidarYRecargar();
    },
    [datos, invalidarYRecargar],
  );

  if (cargando && !datos) {
    return (
      <div className="animate-pulse space-y-6" aria-busy="true" aria-live="polite">
        <span className="sr-only">Cargando catálogo</span>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-outline-variant/40 bg-card shadow-elevation-1"
            >
              <div className="aspect-[3/4] bg-surface-container-high" />
              <div className="space-y-2 p-3">
                <div className="h-3 w-4/5 rounded-full bg-surface-container-high" />
                <div className="h-2.5 w-1/2 rounded-full bg-surface-container" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AnimesCatalogo
      animes={datos?.animes ?? []}
      metadatos={metadatos}
      paginacion={datos?.paginacion}
      cargando={cargando}
      onActualizar={actualizarAnime}
      onEliminado={eliminarAnime}
      onAgregado={invalidarYRecargar}
    />
  );
}
