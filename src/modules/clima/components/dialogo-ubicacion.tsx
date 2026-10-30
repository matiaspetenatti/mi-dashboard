"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  LocateFixed,
  MapPin,
  MapPinned,
  PencilLine,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialogo } from "@/components/ui/dialogo";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatearCoordenadas } from "@/modules/clima/clima-utils";
import { MAX_UBICACIONES_CLIMA } from "@/modules/clima/constantes";
import {
  activarUbicacionClima,
  eliminarUbicacionClima,
  guardarUbicacionClima,
} from "@/modules/clima/actions";
import type { UbicacionClima } from "@/modules/clima/types";

type Modo = "buscar" | "gps" | "manual";

type ResultadoGeocodificacion = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
};

type ResultadoApi = {
  results?: ResultadoGeocodificacion[];
};

function etiquetaDeResultado(resultado: ResultadoGeocodificacion) {
  return [resultado.name, resultado.admin1, resultado.country]
    .filter(Boolean)
    .join(", ");
}

function errorDeGeolocalizacion(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return "No diste permiso para usar tu ubicación.";
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "No pudimos obtener tu ubicación. Probá de nuevo o cargala a mano.";
  }
  return "Se agotó el tiempo para obtener tu ubicación.";
}

type Props = {
  ubicaciones: UbicacionClima[];
  activa: UbicacionClima;
};

/**
 * Diálogo único para agregar ubicaciones y gestionar las guardadas.
 */
export function DialogoUbicacion({ ubicaciones, activa }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pendiente, startTransition] = useTransition();

  const [abierto, setAbierto] = useState(false);
  const [modo, setModo] = useState<Modo>("buscar");
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ResultadoGeocodificacion[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const [latitud, setLatitud] = useState(String(activa.latitud));
  const [longitud, setLongitud] = useState(String(activa.longitud));
  const [etiqueta, setEtiqueta] = useState(activa.etiqueta);
  const [error, setError] = useState<string | null>(null);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);

  const [accionId, setAccionId] = useState<number | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);

  const limiteAlcanzado = ubicaciones.length >= MAX_UBICACIONES_CLIMA;

  function reiniciar() {
    setModo("buscar");
    setBusqueda("");
    setResultados([]);
    setBuscado(false);
    setError(null);
    setErrorBusqueda(null);
    setLatitud(String(activa.latitud));
    setLongitud(String(activa.longitud));
    setEtiqueta(activa.etiqueta);
    setAccionId(null);
    setConfirmandoId(null);
  }

  function abrir() {
    reiniciar();
    setAbierto(true);
  }

  function cerrar() {
    if (pendiente) return;
    setAbierto(false);
  }

  async function buscarCiudad(evento: React.FormEvent) {
    evento.preventDefault();
    const texto = busqueda.trim();
    if (texto.length < 2) return;

    setBuscando(true);
    setErrorBusqueda(null);
    setBuscado(false);

    try {
      const parametros = new URLSearchParams({
        name: texto,
        count: "6",
        language: "es",
        format: "json",
      });
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?${parametros.toString()}`,
      );

      if (!res.ok) throw new Error("La búsqueda falló");

      const data = (await res.json()) as ResultadoApi;
      setResultados(data.results ?? []);
      setBuscado(true);
    } catch {
      setResultados([]);
      setErrorBusqueda("No pudimos buscar la ciudad. Revisá tu conexión.");
    } finally {
      setBuscando(false);
    }
  }

  function elegirResultado(resultado: ResultadoGeocodificacion) {
    setLatitud(String(resultado.latitude));
    setLongitud(String(resultado.longitude));
    setEtiqueta(etiquetaDeResultado(resultado));
    setError(null);
  }

  function usarGps() {
    setError(null);

    if (!("geolocation" in navigator)) {
      setError("Tu navegador no permite obtener la ubicación.");
      return;
    }

    setBuscando(true);
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const lat = posicion.coords.latitude;
        const lon = posicion.coords.longitude;
        setLatitud(String(lat));
        setLongitud(String(lon));
        setEtiqueta(`Mi ubicación (${formatearCoordenadas(lat, lon)})`);
        setBuscando(false);
        setError(null);
      },
      (posicionError) => {
        setBuscando(false);
        setError(errorDeGeolocalizacion(posicionError));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  function guardar() {
    const lat = Number(latitud);
    const lon = Number(longitud);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setError("La latitud debe ser un número entre -90 y 90.");
      return;
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      setError("La longitud debe ser un número entre -180 y 180.");
      return;
    }

    startTransition(async () => {
      const resultado = await guardarUbicacionClima({
        etiqueta: etiqueta.trim() || null,
        latitud: lat,
        longitud: lon,
      });

      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }

      setAbierto(false);
      toast.success("Ubicación guardada", {
        description: etiqueta.trim() || formatearCoordenadas(lat, lon),
      });
      router.refresh();
    });
  }

  function activar(ubicacion: UbicacionClima) {
    if (ubicacion.id === null) return;

    if (ubicacion.id === activa.id) {
      setAbierto(false);
      return;
    }

    setAccionId(ubicacion.id);
    startTransition(async () => {
      const resultado = await activarUbicacionClima(ubicacion.id as number);
      setAccionId(null);

      if (!resultado.ok) {
        toast.error(resultado.error);
        return;
      }

      setAbierto(false);
      toast.success("Ubicación cambiada", {
        description: ubicacion.etiqueta,
      });
      router.refresh();
    });
  }

  function eliminar(ubicacion: UbicacionClima) {
    if (ubicacion.id === null) return;

    setAccionId(ubicacion.id);
    startTransition(async () => {
      const resultado = await eliminarUbicacionClima(ubicacion.id as number);
      setAccionId(null);
      setConfirmandoId(null);

      if (!resultado.ok) {
        toast.error(resultado.error);
        return;
      }

      toast.success("Ubicación eliminada", {
        description: ubicacion.etiqueta,
      });
      router.refresh();
    });
  }

  const coordenadasValidas =
    Number.isFinite(Number(latitud)) &&
    Number.isFinite(Number(longitud)) &&
    latitud.trim() !== "" &&
    longitud.trim() !== "";

  return (
    <>
      <Button
        variant="outlined"
        size="sm"
        onClick={abrir}
        aria-label="Gestionar ubicaciones guardadas"
        className="border-outline-variant/60 bg-card text-charcoal hover:bg-surface-container"
      >
        <MapPinned />
        <span className="hidden sm:inline">Ubicaciones</span>
      </Button>

      <Dialogo
        abierto={abierto}
        onOpenChange={(valor) => {
          if (!valor) cerrar();
        }}
        titulo="Ubicaciones del clima"
        descripcion="Guardá ciudades y cambiá entre ellas con un clic."
      >
        <div className="space-y-5">
          {ubicaciones.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                  Guardadas
                </h3>
                <span className="text-[11px] tabular-nums text-on-surface-variant">
                  {ubicaciones.length}/{MAX_UBICACIONES_CLIMA}
                </span>
              </div>

              <ul className="space-y-1.5">
                {ubicaciones.map((ubicacion) => {
                  const esActiva = ubicacion.id === activa.id;
                  const ocupada = pendiente && accionId === ubicacion.id;
                  const confirmando = confirmandoId === ubicacion.id;

                  return (
                    <li
                      key={ubicacion.id}
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl border px-2 py-1.5",
                        esActiva
                          ? "border-primary bg-primary-container/40"
                          : "border-outline-variant/40 bg-surface-container-low",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => activar(ubicacion)}
                        aria-current={esActiva ? "true" : undefined}
                        aria-busy={ocupada || undefined}
                        disabled={pendiente}
                        className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-on-surface/5 disabled:opacity-70"
                      >
                        <MapPin
                          aria-hidden="true"
                          className={cn(
                            "size-3.5 shrink-0",
                            esActiva ? "text-primary" : "text-on-surface-variant",
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium text-on-surface">
                              {ubicacion.etiqueta}
                            </span>
                            {esActiva && (
                              <span className="shrink-0 rounded-full bg-primary-container px-1.5 py-0.5 text-[10px] font-semibold text-on-primary-container">
                                Activa
                              </span>
                            )}
                          </span>
                          <span className="block truncate text-[11px] tabular-nums text-on-surface-variant">
                            {formatearCoordenadas(
                              ubicacion.latitud,
                              ubicacion.longitud,
                            )}
                          </span>
                        </span>
                        {ocupada && (
                          <Loader2
                            aria-hidden="true"
                            className="size-3.5 shrink-0 animate-spin text-primary"
                          />
                        )}
                      </button>

                      {confirmando ? (
                        <span className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => eliminar(ubicacion)}
                            disabled={pendiente}
                            className="rounded-full bg-error-container px-2 py-1 text-[11px] font-semibold text-on-error-container disabled:opacity-60"
                          >
                            Eliminar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmandoId(null)}
                            disabled={pendiente}
                            aria-label="Cancelar eliminación"
                            className="grid size-7 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-on-surface/10 hover:text-on-surface disabled:opacity-60"
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmandoId(ubicacion.id)}
                          disabled={pendiente}
                          aria-label={`Eliminar ${ubicacion.etiqueta}`}
                          className="grid size-8 shrink-0 place-items-center rounded-full text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container disabled:opacity-60"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="space-y-3">
            {ubicaciones.length > 0 && (
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
                Agregar ubicación
              </h3>
            )}

            <div className="grid grid-cols-3 gap-1 rounded-full bg-surface-container-low p-1">
              {[
                { valor: "buscar" as const, texto: "Ciudad", Icono: Search },
                { valor: "gps" as const, texto: "GPS", Icono: LocateFixed },
                { valor: "manual" as const, texto: "Manual", Icono: PencilLine },
              ].map(({ valor, texto, Icono }) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => {
                    setModo(valor);
                    setError(null);
                  }}
                  aria-pressed={modo === valor}
                  className={cn(
                    "inline-flex items-center justify-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    modo === valor
                      ? "bg-card text-charcoal shadow-elevation-1"
                      : "text-on-surface-variant hover:text-on-surface",
                  )}
                >
                  <Icono size={13} />
                  {texto}
                </button>
              ))}
            </div>

            {modo === "buscar" && (
              <div className="space-y-3">
                <form onSubmit={buscarCiudad} className="flex gap-2">
                  <Input
                    value={busqueda}
                    onChange={(evento) => setBusqueda(evento.target.value)}
                    placeholder="Ej.: Río Cuarto, Córdoba"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    aria-label="Buscar ciudad"
                    disabled={buscando || busqueda.trim().length < 2}
                  >
                    {buscando ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Search />
                    )}
                  </Button>
                </form>

                {errorBusqueda && (
                  <p className="rounded-xl bg-error-container px-3 py-2 text-xs text-on-error-container">
                    {errorBusqueda}
                  </p>
                )}

                {resultados.length > 0 && (
                  <ul className="max-h-56 space-y-1 overflow-y-auto">
                    {resultados.map((resultado) => {
                      const seleccionado =
                        latitud === String(resultado.latitude) &&
                        longitud === String(resultado.longitude);

                      return (
                        <li key={resultado.id}>
                          <button
                            type="button"
                            onClick={() => elegirResultado(resultado)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                              seleccionado
                                ? "border-primary/40 bg-primary/10 text-on-surface"
                                : "border-outline-variant/40 bg-surface-container-low text-on-surface hover:bg-surface-container",
                            )}
                          >
                            <MapPin
                              size={14}
                              className="shrink-0 text-primary"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">
                                {resultado.name}
                              </span>
                              <span className="block truncate text-xs text-on-surface-variant">
                                {[resultado.admin1, resultado.country]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            </span>
                            {seleccionado && (
                              <Check
                                size={14}
                                className="shrink-0 text-primary"
                              />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {buscado && resultados.length === 0 && !errorBusqueda && (
                  <p className="text-xs text-on-surface-variant">
                    No encontramos esa ciudad. Probá con otro nombre o cargá las
                    coordenadas a mano.
                  </p>
                )}
              </div>
            )}

            {modo === "gps" && (
              <div className="space-y-3 rounded-2xl bg-surface-container-low p-4 text-center">
                <LocateFixed size={28} className="mx-auto text-primary" />
                <p className="text-sm text-on-surface-variant">
                  Usamos la ubicación de tu dispositivo. El navegador te va a
                  pedir permiso.
                </p>
                <Button
                  type="button"
                  variant="tonal"
                  size="sm"
                  onClick={usarGps}
                  disabled={buscando}
                >
                  {buscando ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <LocateFixed />
                  )}
                  Obtener mi ubicación
                </Button>
              </div>
            )}

            {modo === "manual" && (
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-medium text-on-surface-variant">
                  Latitud
                  <Input
                    className="mt-1"
                    inputMode="decimal"
                    value={latitud}
                    onChange={(evento) => setLatitud(evento.target.value)}
                    placeholder="-33.1479"
                    autoFocus
                  />
                </label>
                <label className="block text-xs font-medium text-on-surface-variant">
                  Longitud
                  <Input
                    className="mt-1"
                    inputMode="decimal"
                    value={longitud}
                    onChange={(evento) => setLongitud(evento.target.value)}
                    placeholder="-64.3562"
                  />
                </label>
              </div>
            )}

            <label className="block text-xs font-medium text-on-surface-variant">
              Nombre de la ubicación (opcional)
              <Input
                className="mt-1"
                value={etiqueta}
                onChange={(evento) => setEtiqueta(evento.target.value)}
                placeholder={formatearCoordenadas(
                  Number(latitud) || 0,
                  Number(longitud) || 0,
                )}
                maxLength={80}
              />
            </label>

            {error && (
              <p className="rounded-xl bg-error-container px-3 py-2 text-xs text-on-error-container">
                {error}
              </p>
            )}

            {limiteAlcanzado && (
              <p className="rounded-xl bg-surface-container px-3 py-2 text-xs text-on-surface-variant">
                Llegaste al máximo de {MAX_UBICACIONES_CLIMA} ubicaciones.
                Eliminá una para agregar otra.
              </p>
            )}

            <div className="rounded-xl bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
              Se va a usar:{" "}
              <span className="font-medium text-on-surface">
                {etiqueta.trim() ||
                  formatearCoordenadas(
                    Number(latitud) || 0,
                    Number(longitud) || 0,
                  )}
              </span>
              {coordenadasValidas && (
                <span className="mt-0.5 block tabular-nums">
                  {formatearCoordenadas(Number(latitud), Number(longitud))}
                </span>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={cerrar}
                disabled={pendiente}
                className="rounded-full px-4 py-2 text-sm text-on-surface-variant hover:bg-on-surface/5 disabled:opacity-60"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={guardar}
                disabled={pendiente || !coordenadasValidas || limiteAlcanzado}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:opacity-60"
              >
                {pendiente && accionId === null ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                Guardar ubicación
              </button>
            </div>
          </section>
        </div>
      </Dialogo>
    </>
  );
}
