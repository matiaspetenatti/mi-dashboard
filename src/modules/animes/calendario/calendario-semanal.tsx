"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, RefreshCw } from "lucide-react";

type ItemCalendario = {
  id: string;
  animeId: number;
  animeVistoId: number;
  titulo: string;
  imagen: string;
  episodio: number | null;
  hora: string;
  fecha: string;
  airingAt: string;
};

type DiaCalendario = {
  indice: number;
  nombre: string;
  items: ItemCalendario[];
};

type AnimeSinHorario = {
  animeId: number;
  animeVistoId: number;
  titulo: string;
  imagen: string;
};

type DatosCalendario = {
  semana: { inicio: string; fin: string };
  dias: DiaCalendario[];
  sinHorarios: AnimeSinHorario[];
  actualizadoEn: string;
};

export function CalendarioSemanal() {
  const [datos, setDatos] = useState<DatosCalendario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarCalendario = async (force = false) => {
    try {
      if (force) setActualizando(true);
      else setCargando(true);
      setError(null);
      
      const res = await fetch(`/api/animes/calendario${force ? "?force=true" : ""}`);
      if (!res.ok) throw new Error("Error al cargar");
      
      const data = await res.json();
      setDatos(data);
    } catch (e) {
      setError("No se pudo cargar el calendario");
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  };

  useEffect(() => {
    cargarCalendario();
  }, []);

  if (cargando && !datos) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-on-surface-variant">
        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
        Cargando calendario...
      </div>
    );
  }

  if (error && !datos) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-outline-variant/50 bg-card px-6 py-12">
        <p className="text-sm font-medium text-on-error-container">{error}</p>
        <button
          onClick={() => cargarCalendario()}
          className="rounded-full border border-outline-variant/60 bg-card px-3.5 py-1.5 text-xs font-semibold text-charcoal transition hover:bg-surface-container"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!datos || (datos.dias.every((d) => d.items.length === 0) && datos.sinHorarios.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-low px-6 py-12 text-center">
        <span className="grid size-10 place-items-center rounded-full bg-primary-container text-on-primary-container">
          <Calendar className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-charcoal">
          No tenés animes en estado &quot;Viendo&quot; o no hay horarios esta semana
        </p>
        <p className="text-xs text-pebble">
          Los animes con estado &quot;Viendo&quot; aparecerán aquí cuando tengan horario confirmado
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-on-surface">
            <Calendar className="h-5 w-5" />
            Calendario semanal
          </h2>
          <p className="text-sm text-on-surface-variant">
            Horario de Argentina • {datos.semana.inicio} al {datos.semana.fin}
          </p>
        </div>
        <button
          onClick={() => cargarCalendario(true)}
          disabled={actualizando}
          className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/60 bg-card px-3.5 py-1.5 text-xs font-semibold text-charcoal transition hover:bg-surface-container disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${actualizando ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {datos.dias.map((dia) => (
          <div
            key={dia.indice}
            className="overflow-hidden rounded-xl border border-outline-variant/40 bg-card shadow-elevation-1"
          >
            <div className="border-b border-outline-variant/40 bg-surface-container-low px-3 py-2">
              <h3 className="text-sm font-semibold text-on-surface">{dia.nombre}</h3>
              {dia.items.length > 0 && (
                <p className="text-xs text-on-surface-variant">
                  {dia.items.length} {dia.items.length === 1 ? "episodio" : "episodios"}
                </p>
              )}
            </div>
            <div className="min-h-[200px] space-y-2 p-2">
              {dia.items.length === 0 ? (
                <p className="py-4 text-center text-xs text-pebble">Sin estrenos</p>
              ) : (
                dia.items.map((item) => (
                  <Link
                    key={item.id}
                    href="/animes"
                    className="block rounded-lg border border-outline-variant/40 p-2 transition-colors hover:border-outline-variant hover:bg-surface-container-low"
                  >
                    <div className="flex gap-2">
                      <Image
                        src={item.imagen}
                        alt={item.titulo}
                        width={40}
                        height={56}
                        className="flex-shrink-0 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="line-clamp-2 text-xs font-medium leading-tight text-charcoal">
                          {item.titulo}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                          <Clock className="h-3 w-3" />
                          <span className="font-semibold tabular-nums text-charcoal">{item.hora}</span>
                        </div>
                        {item.episodio && (
                          <p className="text-xs text-pebble">
                            Ep. {item.episodio}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {datos.sinHorarios.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-outline-variant/40 bg-card shadow-elevation-1">
          <div className="border-b border-outline-variant/40 bg-surface-container-low px-4 py-3">
            <h3 className="text-sm font-semibold text-on-surface">Sin horario definido esta semana</h3>
            <p className="text-xs text-on-surface-variant">
              Animes que estás viendo pero no tienen emisión programada
            </p>
          </div>
          <div className="grid gap-2 p-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {datos.sinHorarios.map((anime) => (
              <Link
                key={anime.animeId}
                href="/animes"
                className="flex items-center gap-2 rounded-lg border border-outline-variant/40 p-2 transition-colors hover:border-outline-variant hover:bg-surface-container-low"
              >
                <Image
                  src={anime.imagen}
                  alt={anime.titulo}
                  width={32}
                  height={44}
                  className="flex-shrink-0 rounded-md object-cover"
                />
                <p className="line-clamp-2 text-xs font-medium text-charcoal">{anime.titulo}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
