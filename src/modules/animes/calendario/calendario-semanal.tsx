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
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-neutral-500">Cargando calendario...</p>
      </div>
    );
  }

  if (error && !datos) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => cargarCalendario()}
          className="px-3 py-1.5 text-sm rounded-lg border hover:bg-neutral-50"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!datos || (datos.dias.every((d) => d.items.length === 0) && datos.sinHorarios.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <Calendar className="h-8 w-8 text-neutral-400" />
        <p className="text-sm text-neutral-500 text-center">
          No tenés animes en estado "Viendo" o no hay horarios esta semana
        </p>
        <p className="text-xs text-neutral-400 text-center">
          Los animes con estado "Viendo" aparecerán aquí cuando tengan horario confirmado
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendario semanal
          </h2>
          <p className="text-sm text-neutral-500">
            Horario de Argentina • {datos.semana.inicio} al {datos.semana.fin}
          </p>
        </div>
        <button
          onClick={() => cargarCalendario(true)}
          disabled={actualizando}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border hover:bg-neutral-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${actualizando ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {datos.dias.map((dia) => (
          <div
            key={dia.indice}
            className="rounded-xl border bg-white overflow-hidden"
          >
            <div className="px-3 py-2 border-b bg-neutral-50">
              <h3 className="font-medium text-sm">{dia.nombre}</h3>
              {dia.items.length > 0 && (
                <p className="text-xs text-neutral-500">
                  {dia.items.length} {dia.items.length === 1 ? "episodio" : "episodios"}
                </p>
              )}
            </div>
            <div className="p-2 space-y-2 min-h-[200px]">
              {dia.items.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-4">Sin estrenos</p>
              ) : (
                dia.items.map((item) => (
                  <Link
                    key={item.id}
                    href="/animes"
                    className="block rounded-lg border p-2 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex gap-2">
                      <Image
                        src={item.imagen}
                        alt={item.titulo}
                        width={40}
                        height={56}
                        className="rounded object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-xs font-medium line-clamp-2 leading-tight">
                          {item.titulo}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-neutral-600">
                          <Clock className="h-3 w-3" />
                          <span className="font-medium">{item.hora}</span>
                        </div>
                        {item.episodio && (
                          <p className="text-xs text-neutral-500">
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
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b bg-neutral-50">
            <h3 className="font-medium text-sm">Sin horario definido esta semana</h3>
            <p className="text-xs text-neutral-500">
              Animes que estás viendo pero no tienen emisión programada
            </p>
          </div>
          <div className="p-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {datos.sinHorarios.map((anime) => (
              <Link
                key={anime.animeId}
                href="/animes"
                className="flex items-center gap-2 rounded-lg border p-2 hover:bg-neutral-50 transition-colors"
              >
                <Image
                  src={anime.imagen}
                  alt={anime.titulo}
                  width={32}
                  height={44}
                  className="rounded object-cover flex-shrink-0"
                />
                <p className="text-xs font-medium line-clamp-2">{anime.titulo}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
